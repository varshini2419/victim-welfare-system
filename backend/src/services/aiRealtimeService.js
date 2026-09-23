const WebSocket = require('ws');

class GeminiRealtimeSession {
  constructor(apiKey, language, instruction, isReconnect) {
    this.isReconnect = isReconnect === true;
    this.instruction = instruction;
    this.apiKey = apiKey;
    this.language = language || 'en-IN';
    this.ws = null;
    this.isClosed = false;
    this.onMessage = null;
    this.onClose = null;
    this.sessionId = 'voice-session-' + Math.floor(Math.random() * 10000);
    this.lastInputTime = null;
    this.firstAudioReceivedForTurn = false;
  }

  connect(onReady, onError) {
    if (!this.apiKey) {
      onError(new Error("GEMINI_API_KEY is not configured on the server."));
      return;
    }

    const host = 'generativelanguage.googleapis.com';
    const path = '/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
    const url = `wss://${host}${path}?key=${this.apiKey}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        const modelName = process.env.GEMINI_MODEL_NAME || 'models/gemini-2.5-flash-native-audio-latest';
                const setupMessage = {
          setup: {
            model: modelName.startsWith('models/') ? modelName : `models/${modelName}`,
            systemInstruction: {
              parts: [{ text: this.instruction || `You are AAROHAN AI, a helpful victim support counselor. Speak in ${this.language}.` }]
            },
            generationConfig: {
              responseModalities: ["AUDIO"]
            }
          }
        };
        this.ws.send(JSON.stringify(setupMessage));
        
        // Phase 1: Proactive greeting trigger (skip if reconnect)
        if (!this.isReconnect) {
          const initialGreetingMessage = {
            clientContent: {
              turns: [
                {
                  role: 'user',
                  parts: [{ text: 'Hello, I just connected. Please briefly introduce yourself and ask me how I am feeling today. Speak in my preferred language.' }]
                }
              ],
              turnComplete: true
            }
          };
          this.ws.send(JSON.stringify(initialGreetingMessage));
        }
        
        onReady();
      });

      this.ws.on('message', (data) => {
        try {
          const payload = data.toString();
          
          if (!this.firstAudioReceivedForTurn && payload.includes('"audio/pcm')) {
            const now = performance.now();
            this.firstAudioReceivedForTurn = true;
            if (this.lastInputTime) {
              const ttfa = now - this.lastInputTime;
              console.log(`[VOICE_LATENCY] [${this.sessionId}] GEMINI_TTFA: ${ttfa.toFixed(2)} ms`);
            }
          }

          if (this.onMessage) {
            this.onMessage(payload);
          }
        } catch (e) {
          console.error("Error handling Gemini message:", e);
        }
      });

      this.ws.on('error', (err) => {
        if (!this.isClosed) {
          const errMsg = (err?.message || '') + ' ' + (err?.code || '');
          const isFatal = /API key|PERMISSION_DENIED|UNAUTHENTICATED|INVALID_ARGUMENT|not valid|forbidden|401|403/i.test(errMsg);
          if (isFatal) err.isFatal = true;
          onError(err);
        }
      });

      this.ws.on('close', (code, reason) => {
        this.isClosed = true;
        const reasonStr = reason ? reason.toString() : '';
        const FATAL_CLOSE_CODES = [1002, 1003, 1008, 1009, 1010];
        const isFatal = FATAL_CLOSE_CODES.includes(code) ||
          /API key|PERMISSION_DENIED|UNAUTHENTICATED|not valid|forbidden/i.test(reasonStr);
        if (this.onClose) {
          this.onClose(code, reasonStr, isFatal);
        }
      });

    } catch (err) {
      onError(err);
    }
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isClosed) {
      if (payload.includes('"realtimeInput"')) {
        this.lastInputTime = performance.now();
        this.firstAudioReceivedForTurn = false;
      }
      this.ws.send(payload);
    }
  }

  close() {
    this.isClosed = true;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;
  }
}

module.exports = { GeminiRealtimeSession };
