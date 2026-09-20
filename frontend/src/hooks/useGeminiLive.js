import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';

// Fallback worklet source. The primary module is served from /worklets/pcm-processor.js
// because AudioWorklet.addModule() rejects blob: URLs in Chromium
// ("Unable to load a worklet's module"), so we only use the blob as a last resort.
const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  this.bufferSize = 2048;
  this.buffer = new Float32Array(this.bufferSize);
  this.index = 0;
}

process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0]) return true;
    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.index++] = channel[i];
      if (this.index >= this.bufferSize) {
        this.port.postMessage({ type: 'audio', data: this.buffer });
        this.buffer = new Float32Array(this.bufferSize);
        this.index = 0;
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

// Native-audio Live sessions are dropped by the server intermittently with
// WS close code 1011 (known issue, especially around function calling).
// We transparently reconnect with exponential backoff instead of ending the call.
const MAX_RECONNECT_ATTEMPTS = 4;

// Playback jitter buffer: chunks are scheduled at least this far ahead of
// "now" so small network hiccups don't cause audible gaps. Adds <100ms to
// the very first sound of a response, nothing to subsequent chunks.
const PLAYBACK_PREBUFFER_S = 0.08;

export default function useGeminiLive(apiKey, customInstruction = "") {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sessionRef = useRef(null);
  const isConnectingRef = useRef(false);
  const audioContextRef = useRef(null);
  const playbackContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const workletNodeRef = useRef(null);
  const activeAudioNodesRef = useRef([]);
  const nextPlayTimeRef = useRef(0);
  const callStartTimeRef = useRef(null);
  const reportedConditionsRef = useRef([]);
  const connectionIdRef = useRef(0);
  const resumptionHandleRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const shouldReconnectRef = useRef(false);

  const base64Encode = (bytes) => {
    // Chunked conversion: String.fromCharCode per byte is O(n^2) string churn
    // and can blow the arg limit on large chunks; slicing keeps it linear.
    const len = bytes.byteLength;
    const chunks = [];
    const CHUNK = 0x8000;
    for (let i = 0; i < len; i += CHUNK) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK)));
    }
    return btoa(chunks.join(''));
  };

  const base64Decode = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const createPcmBlob = (data) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: base64Encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const playPCMChunk = async (base64PCM) => {
    try {
      const bytes = base64Decode(base64PCM);
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      let ctx = playbackContextRef.current;
      if (!ctx || ctx.state === 'closed') return;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const buffer = ctx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      source.onended = () => {
        activeAudioNodesRef.current = activeAudioNodesRef.current.filter((n) => n !== source);
        if (activeAudioNodesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };

      activeAudioNodesRef.current.push(source);
      setIsSpeaking(true);

      const now = ctx.currentTime;
      if (nextPlayTimeRef.current < now + PLAYBACK_PREBUFFER_S) {
        nextPlayTimeRef.current = now + PLAYBACK_PREBUFFER_S;
      }
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
    } catch (e) {
      console.error("Playback error:", e);
    }
  };

  // Full teardown + end-of-call logging. Stable ([] deps) so it can be
  // referenced from connect and its callbacks safely.
  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    connectionIdRef.current = 0;
    shouldReconnectRef.current = false;
    resumptionHandleRef.current = null;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);

    activeAudioNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    activeAudioNodesRef.current = [];
    nextPlayTimeRef.current = 0;

    if (workletNodeRef.current) {
      try { workletNodeRef.current.disconnect(); } catch (e) {}
      workletNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }

    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }

    if (callStartTimeRef.current) {
      const durationMs = Date.now() - callStartTimeRef.current;
      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);
      const durationStr = `${mins}m ${secs}s`;

      let summaryStr = 'No emotion data collected.';
      if (reportedConditionsRef.current.length > 0) {
        const avgScore = Math.round(reportedConditionsRef.current.reduce((sum, item) => sum + (item.distress_score || 0), 0) / reportedConditionsRef.current.length);
        const lastEmotions = reportedConditionsRef.current[reportedConditionsRef.current.length - 1].emotions;

        const topics = reportedConditionsRef.current
          .filter(item => item.user_said)
          .map(item => item.user_said)
          .join(' | ');

        summaryStr = `Call ended. Average distress score: ${avgScore}. Final emotions logged: ${lastEmotions || 'neutral'}. Discussed: ${topics || 'Brief conversation.'}`;
      }

      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/v1/chatbot/voice-end', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ duration: durationStr, summary: summaryStr })
        }).catch(err => console.error("Failed to log voice end:", err));
      }

      callStartTimeRef.current = null;
    }
  }, []);

  const connect = useCallback(async ({ isReconnect = false } = {}) => {
    if (!apiKey) {
      setError("Please provide a Gemini API key.");
      return;
    }
    if (sessionRef.current || isConnectingRef.current) {
      console.log("Already connecting/connected.");
      return;
    }

    isConnectingRef.current = true;
    setError(null);
    const myConnectionId = Date.now() + Math.random();
    connectionIdRef.current = myConnectionId;
    shouldReconnectRef.current = true;
    if (!isReconnect) {
      reconnectAttemptsRef.current = 0;
      // A fresh call must NOT resume the previous session's context.
      resumptionHandleRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const ctxCapture = { input: null, playback: null };

    // Tear down per-connection audio resources. Keeps call state so a
    // reconnect can resume logging under the same call.
    const teardownConnection = () => {
      activeAudioNodesRef.current.forEach(node => {
        try { node.stop(); } catch (e) {}
      });
      activeAudioNodesRef.current = [];
      nextPlayTimeRef.current = 0;

      if (workletNodeRef.current) {
        try { workletNodeRef.current.disconnect(); } catch (e) {}
        workletNodeRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
      if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
        playbackContextRef.current.close().catch(() => {});
      }
      playbackContextRef.current = null;
      sessionRef.current = null;
      isConnectingRef.current = false;
    };

    // Reconnect with exponential backoff when the server drops the session.
    const scheduleReconnect = (closedConnectionId, code) => {
      if (!shouldReconnectRef.current) {
        // Call was ended by the user; do the full teardown/logging.
        disconnect();
        return;
      }
      const attempt = reconnectAttemptsRef.current + 1;
      if (attempt > MAX_RECONNECT_ATTEMPTS) {
        console.warn("Gemini Live: giving up after", reconnectAttemptsRef.current, "reconnect attempts");
        disconnect();
        return;
      }
      reconnectAttemptsRef.current = attempt;
      // First retry is near-immediate; with transparent session resumption
      // there is no state to rebuild, so don't make the user wait.
      const delay = attempt === 1
        ? 400 + Math.random() * 300
        : Math.min(6000, 1200 * Math.pow(2, attempt - 2)) + Math.random() * 600;
      console.log(`Gemini Live: reconnecting in ${Math.round(delay)}ms (attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}) after code ${code}`);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!shouldReconnectRef.current || connectionIdRef.current !== closedConnectionId) return;
        connect({ isReconnect: true });
      }, delay);
    };

    // Handle a function call from the model and acknowledge it.
    // NOTE: tool calls arrive as a dedicated `toolCall` server message on
    // current native-audio models (NOT inside modelTurn.parts), and the
    // function response MUST echo the tool call `id` on the Gemini API,
    // otherwise sendToolResponse throws and the session can be dropped (1011).
    const handleFunctionCall = (fc) => {
      if (!fc) return;
      let responseText = "Done.";
      try {
        if (fc.name === "report_patient_condition") {
          console.log("CRISIS DETECTED BY AI:", fc.args);
          if (fc.args) {
            reportedConditionsRef.current.push(fc.args);
            // Call backend API to trigger escalation or log the condition
            const token = localStorage.getItem('token');
            fetch('/api/v1/chatbot/voice-escalation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(fc.args)
            }).catch(err => console.error("Failed to trigger voice escalation:", err));
          }
          responseText = "Condition logged successfully. Please tell the user that help is available.";
        } else if (fc.name === "log_conversation_turn") {
          console.log("CONVERSATION TURN LOGGED:", fc.args);
          if (fc.args) {
            reportedConditionsRef.current.push({
              distress_score: fc.args.distress_score || 0,
              emotions: fc.args.emotion || 'neutral',
              user_said: fc.args.user_said
            });

            const token = localStorage.getItem('token');
            fetch('/api/v1/chatbot/voice-log', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(fc.args)
            }).catch(err => console.error("Failed to log voice turn:", err));
          }
          responseText = "Turn logged successfully.";
        }
      } catch (e) {
        console.warn("Error processing function call:", e);
      }

      // Acknowledge the tool call back to Gemini
      try {
        const functionResponse = {
          name: fc.name,
          response: { result: responseText },
        };
        if (fc.id) functionResponse.id = fc.id;
        sessionRef.current?.sendToolResponse({
          functionResponses: [functionResponse],
        });
      } catch (e) {
        console.warn("Could not send tool response:", e);
      }
    };

    try {
      // 1. Initialize Web Audio Contexts
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      ctxCapture.input = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = ctxCapture.input;
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      ctxCapture.playback = new AudioContextClass();
      playbackContextRef.current = ctxCapture.playback;

      // Pre-warm playback audio context immediately
      if (playbackContextRef.current.state === 'suspended') {
        playbackContextRef.current.resume().catch(() => {});
      }

      // 2. Load AudioWorklet. Must be a real same-origin file served by Vite
      // (public/worklets/pcm-processor.js); blob: URLs fail in Chromium.
      try {
        await audioContextRef.current.audioWorklet.addModule('/worklets/pcm-processor.js');
      } catch (err) {
        console.warn("AudioWorklet module load failed from /worklets, trying blob fallback:", err.message);
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        try {
          await audioContextRef.current.audioWorklet.addModule(workletUrl);
        } catch (err2) {
          console.error("AudioWorklet module load aborted/failed:", err2.message);
        }
      }

      // Check if aborted
      if (connectionIdRef.current !== myConnectionId) {
        if (ctxCapture.input && ctxCapture.input.state !== 'closed') ctxCapture.input.close().catch(() => {});
        if (ctxCapture.playback && ctxCapture.playback.state !== 'closed') ctxCapture.playback.close().catch(() => {});
        isConnectingRef.current = false;
        return;
      }

      // 3. Request mic permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      mediaStreamRef.current = stream;

      // Check if aborted
      if (connectionIdRef.current !== myConnectionId) {
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        if (ctxCapture.input && ctxCapture.input.state !== 'closed') ctxCapture.input.close().catch(() => {});
        if (ctxCapture.playback && ctxCapture.playback.state !== 'closed') ctxCapture.playback.close().catch(() => {});
        isConnectingRef.current = false;
        return;
      }

      // 4. Connect to Google GenAI Live Socket
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { apiVersion: 'v1alpha' }
      });

      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          systemInstruction: {
            parts: [{ text: customInstruction || "You are AAROHAN, a warm, supportive counselor and a deeply empathetic friend for victims in India, grounded in Indian law. In every reply: FIRST validate their feeling in one natural sentence (never use cliches like 'I am here for you'), THEN empower them — if an Indian law clearly applies (Constitution Art. 14/15/21, free legal aid under Art. 39A, defamation, criminal intimidation, IT Act for cybercrime, POCSO, Domestic Violence Act, SC/ST Act, anti-ragging UGC rules), say briefly that the law is on their side and name it; never invent section numbers. END with one concrete next step (FIR at any police station, cybercrime.gov.in, NALSA helpline 15100, Tele-MANAS 14416) or one gentle question. Keep every reply 2-3 short spoken sentences. Speak kindly and naturally. You MUST regularly call the report_patient_condition tool if you detect any signs of self-harm, suicidal ideation, or severe distress. You MUST call the log_conversation_turn tool after EVERY time the user speaks. When the call first starts, immediately introduce yourself as their supportive counselor from Aarohan and ask how they are feeling today." }]
          },
          // Low-latency tuning: sensitive turn detection, short end-of-turn
          // silence, barge-in enabled, transparent session resumption so a
          // dropped/reconnected session keeps the conversation state.
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
              endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
              prefixPaddingMs: 60,
              silenceDurationMs: 220,
            },
            activityHandling: 'START_OF_ACTIVITY_INTERRUPTS',
          },
          // NOTE: `transparent: true` is Gemini Enterprise only - the
          // Gemini Developer API rejects it, so we only pass a plain handle.
          sessionResumption: resumptionHandleRef.current
            ? { handle: resumptionHandleRef.current }
            : undefined,
          contextWindowCompression: { slidingWindow: {} },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "report_patient_condition",
                  description: "Call this immediately if the user expresses self-harm, severe distress, or needs emergency help.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      distress_score: { type: "INTEGER", description: "Score from 0 to 100" },
                      crisis_flag: { type: "BOOLEAN", description: "True if in immediate danger" },
                      emotions: { type: "STRING", description: "E.g., fear, sadness, anger" }
                    },
                    required: ["distress_score", "crisis_flag", "emotions"]
                  }
                },
                {
                  name: "log_conversation_turn",
                  description: "Call this after EVERY user speech to log the interaction in the counselor's dashboard.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      user_said: { type: "STRING", description: "A brief summary of what the user just said" },
                      ai_response: { type: "STRING", description: "A brief summary of what you are responding with" },
                      distress_score: { type: "INTEGER", description: "Estimated distress score for this turn (0-100)" },
                      emotion: { type: "STRING", description: "Detected emotion for this turn" }
                    },
                    required: ["user_said", "ai_response"]
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onopen: () => {
            if (connectionIdRef.current !== myConnectionId) return;
            console.log("Gemini Live connection established");
            setIsConnected(true);
            if (!callStartTimeRef.current) {
              callStartTimeRef.current = Date.now();
            }
            if (!isReconnect) {
              reportedConditionsRef.current = [];

              // Add start voice call API call (only on the initial connect)
              const token = localStorage.getItem('token');
              if (token) {
                fetch('/api/v1/chatbot/voice-start', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                }).catch(e => console.error("Failed to start voice:", e));
              }
            }

            if (playbackContextRef.current && playbackContextRef.current.state === 'suspended') {
              playbackContextRef.current.resume().catch(() => {});
            }

            // Reset backoff once a connection proves stable
            setTimeout(() => {
              if (connectionIdRef.current === myConnectionId) {
                reconnectAttemptsRef.current = 0;
              }
            }, 15000);

            // Connect microphone to AudioWorklet
            if (audioContextRef.current && mediaStreamRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
              workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'pcm-processor');

              workletNodeRef.current.port.onmessage = (e) => {
                if (!sessionRef.current || connectionIdRef.current !== myConnectionId) return;
                const message = e.data;
                if (message.type === 'audio') {
                  const pcmBlob = createPcmBlob(message.data);
                  try {
                    sessionRef.current.sendRealtimeInput({ media: pcmBlob });
                  } catch (err) {
                    console.warn('Error sending audio:', err);
                  }
                }
              };

              source.connect(workletNodeRef.current);
              workletNodeRef.current.connect(audioContextRef.current.destination);
            }
          },
          onmessage: (message) => {
            if (connectionIdRef.current !== myConnectionId) return;

            // Keep the latest resumable handle for transparent reconnects.
            if (message.sessionResumptionUpdate?.resumable && message.sessionResumptionUpdate.newHandle) {
              resumptionHandleRef.current = message.sessionResumptionUpdate.newHandle;
            }

            // Server announces a planned disconnect (e.g. load balancing).
            // Close now; onclose schedules the transparent reconnect.
            if (message.goAway) {
              console.log("Gemini Live: goAway received, closing for reconnect");
              try { sessionRef.current?.close(); } catch (e) {}
              return;
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              // Stop all playing audio nodes instantly
              activeAudioNodesRef.current.forEach(node => {
                try { node.stop(); } catch (e) {}
              });
              activeAudioNodesRef.current = [];
              setIsSpeaking(false);

              if (playbackContextRef.current) {
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
              }
            }

            // Handle Audio Playback
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                  const pcmData = part.inlineData.data;
                  if (pcmData) {
                    playPCMChunk(pcmData);
                  }
                } else if (part.functionCall) {
                  // Legacy delivery path; current models send toolCall messages.
                  handleFunctionCall(part.functionCall);
                }
              }
            }

            // Function calls arrive as a dedicated toolCall message.
            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                handleFunctionCall(fc);
              }
            }
          },
          onclose: (event) => {
            if (connectionIdRef.current !== myConnectionId) return;
            console.log("Gemini Live Session Closed", event?.code, event?.reason);
            setIsConnected(false);
            setIsSpeaking(false);
            teardownConnection();
            scheduleReconnect(myConnectionId, event?.code);
          },
          onerror: (err) => {
            if (connectionIdRef.current !== myConnectionId) return;
            console.error("Gemini Live Session Error", err);
            // Do not disconnect here: onclose follows and handles reconnect.
          }
        }
      });

      // If a new connection started while this one was setting up, close this one.
      if (connectionIdRef.current !== myConnectionId) {
        try { session.close(); } catch (e) {}
        isConnectingRef.current = false;
        return;
      }

      sessionRef.current = session;
      isConnectingRef.current = false;

      // Give the session a moment to settle before the first text turn.
      await new Promise((r) => setTimeout(r, 120));

      // A resumed session already has the conversation state (and the model
      // may be mid-response), so do not re-send the greeting trigger.
      if (isReconnect) return;

      try {
        session.sendClientContent({
          turns: [{
            role: 'user',
            parts: [{ text: "System trigger: The user has just connected to the voice call. Please speak first, greet them warmly as their counselor, and ask how they are feeling today." }],
          }],
          turnComplete: true,
        });
      } catch (err) {
        console.warn("Could not send initial trigger:", err);
      }

    } catch (err) {
      if (connectionIdRef.current === myConnectionId) {
        console.error(err);
        setError("Setup failed: " + err.message);
        isConnectingRef.current = false;
      }
    }
  }, [apiKey, customInstruction, disconnect]);

  return { isConnected, error, connect, disconnect, isSpeaking };
}
