import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';

// Fallback worklet source. The primary module is served from /worklets/pcm-processor.js
// because AudioWorklet.addModule() rejects blob: URLs in Chromium
// ("Unable to load a worklet's module"), so we only use the blob as a last resort.
const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 1024;
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
if (typeof registerProcessor === 'function') {
  try {
    registerProcessor('pcm-processor', PCMProcessor);
  } catch (e) {}
}
`;

// Native-audio Live sessions are dropped by the server intermittently with
// WS close code 1011 (known issue, especially around function calling).
// We transparently reconnect with exponential backoff instead of ending the call.
const MAX_RECONNECT_ATTEMPTS = 4;

// Playback jitter buffer: chunks are scheduled at least this far ahead of
// "now" so small network hiccups don't cause audible gaps. Adds ~100ms to
// the very first sound of a response, nothing to subsequent chunks.
const PLAYBACK_PREBUFFER_S = 0.10;

export default function useGeminiLive(apiKey, customInstruction = "", language = "en-IN") {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Unified State Machine:
  // DISCONNECTED | CONNECTING | CONNECTED_IDLE | USER_SPEAKING | WAITING_FOR_GEMINI | AI_SPEAKING | INTERRUPTED
  const voiceStateRef = useRef('DISCONNECTED');
  const isSpeakingRef = useRef(false);

  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;
  const customInstructionRef = useRef(customInstruction);
  customInstructionRef.current = customInstruction;
  const languageRef = useRef(language);
  languageRef.current = language;

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

  const silenceTimerRef = useRef(null);
  const userSpeechTimerRef = useRef(null);
  const lastMeaningfulSpeechRef = useRef(0);

  // Telemetry ref
  const diagRef = useRef({
    turn: 1,
    speechStart: null,
    speechEnd: null,
    firstAudioReceived: null,
    firstAudioScheduled: null,
    isActiveTurn: false,
  });

  const base64Encode = (bytes) => {
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

  const isNewTurnRef = useRef(true);
  const setupCompleteRef = useRef(false);
  const greetingSentRef = useRef(false);
  const unlockListenersRef = useRef([]);

  // Reset silence / check-in timer only when genuinely in CONNECTED_IDLE
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (voiceStateRef.current === 'CONNECTED_IDLE' && !isSpeakingRef.current) {
      silenceTimerRef.current = setTimeout(() => {
        silenceTimerRef.current = null;
        const activeSession = sessionRef.current;
        if (voiceStateRef.current === 'CONNECTED_IDLE' && !isSpeakingRef.current && activeSession) {
          try {
            activeSession.sendClientContent({
              turns: [{
                role: 'user',
                parts: [{ text: "System check: The user has been quiet for a while. Please gently ask if they are still there and if they need any further help, in their preferred language." }]
              }],
              turnComplete: true
            });
          } catch (e) {
            console.error("[AROHAN_LIVE] Error sending silence check:", e);
          }
        }
      }, 25000);
    }
  }, []);

  const playPCMChunk = async (base64PCM) => {
    try {
      const bytes = base64Decode(base64PCM);
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }
      console.log('[AROHAN_LIVE] AUDIO_DECODED', float32Data.length, 'samples');

      let ctx = playbackContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContextClass();
        playbackContextRef.current = ctx;
      }

      console.log('[AROHAN_LIVE] PLAYBACK_CONTEXT_BEFORE', 'state=' + ctx.state, 'currentTime=' + ctx.currentTime.toFixed(3), 'sampleRate=' + ctx.sampleRate);

      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
          console.log('[AROHAN_LIVE] PLAYBACK_CONTEXT_RESUMED', 'state=' + ctx.state);
        } catch (e) {
          console.warn("[useGeminiLive] Playback context resume deferred:", e);
        }
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
          isSpeakingRef.current = false;
          if (voiceStateRef.current === 'AI_SPEAKING' || voiceStateRef.current === 'INTERRUPTED') {
            voiceStateRef.current = 'CONNECTED_IDLE';
            resetSilenceTimer();
          }
        }
      };

      activeAudioNodesRef.current.push(source);
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      voiceStateRef.current = 'AI_SPEAKING';

      const now = ctx.currentTime;
      if (isNewTurnRef.current || nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + PLAYBACK_PREBUFFER_S;
        isNewTurnRef.current = false;
      }
      console.log('[AROHAN_LIVE] AUDIO_SCHEDULED', 'startAt=' + nextPlayTimeRef.current.toFixed(3), 'now=' + now.toFixed(3), 'duration=' + buffer.duration.toFixed(3));
      source.start(nextPlayTimeRef.current);
      console.log('[AROHAN_LIVE] AUDIO_STARTED');
      nextPlayTimeRef.current += buffer.duration;

      // Telemetry log for first scheduled chunk of turn
      if (diagRef.current.isActiveTurn && diagRef.current.firstAudioReceived && !diagRef.current.firstAudioScheduled) {
        diagRef.current.firstAudioScheduled = performance.now();
        const d = diagRef.current;
        const speechDur = d.speechEnd && d.speechStart ? (d.speechEnd - d.speechStart) : 0;
        const ue_to_fa = d.speechEnd ? (d.firstAudioReceived - d.speechEnd) : 0;
        const fa_to_sch = d.firstAudioScheduled - d.firstAudioReceived;
        const total = d.speechEnd ? (d.firstAudioScheduled - d.speechEnd) : 0;

        console.log(`\n[VOICE_LATENCY] turn=${d.turn}`);
        console.log(`user_speech_start=${d.speechStart ? d.speechStart.toFixed(0) : 'N/A'} ms`);
        console.log(`user_speech_end=${d.speechEnd ? d.speechEnd.toFixed(0) : 'N/A'} ms (duration: ${speechDur.toFixed(0)} ms)`);
        console.log(`first_audio_received=${d.firstAudioReceived.toFixed(0)} ms`);
        console.log(`first_audio_scheduled=${d.firstAudioScheduled.toFixed(0)} ms`);
        console.log(`total_turn_latency=${total.toFixed(0)} ms\n`);

        diagRef.current.isActiveTurn = false;
        diagRef.current.turn += 1;
        diagRef.current.speechStart = null;
        diagRef.current.speechEnd = null;
        diagRef.current.firstAudioReceived = null;
        diagRef.current.firstAudioScheduled = null;
      }
    } catch (e) {
      console.error("[AROHAN_LIVE] ERROR in playPCMChunk:", e);
    }
  };

  const sendInitialGreetingIfReady = useCallback(() => {
    const activeSession = sessionRef.current;

    if (!activeSession) {
      console.log("[AROHAN_LIVE] Greeting waiting for session assignment");
      return false;
    }

    if (!setupCompleteRef.current) {
      console.log("[AROHAN_LIVE] Greeting waiting for setupComplete");
      return false;
    }

    if (greetingSentRef.current) {
      return true;
    }

    try {
      activeSession.sendClientContent({
        turns: [{
          role: "user",
          parts: [{
            text: "System trigger: The user has just connected to the voice call. Please speak first, greet them warmly as their counselor, and ask how they are feeling today."
          }]
        }],
        turnComplete: true
      });

      greetingSentRef.current = true;

      console.log("[AROHAN_LIVE] GREETING_SENT");

      return true;
    } catch (error) {
      console.error("[AROHAN_LIVE] GREETING_SEND_FAILED", error);
      return false;
    }
  }, []);

  // Full teardown + end-of-call logging
  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    connectionIdRef.current = 0;
    shouldReconnectRef.current = false;
    resumptionHandleRef.current = null;
    voiceStateRef.current = 'DISCONNECTED';
    isNewTurnRef.current = true;
    greetingSentRef.current = false;
    setupCompleteRef.current = false;

    if (unlockListenersRef.current.length > 0) {
      unlockListenersRef.current.forEach(({ type, fn }) => {
        window.removeEventListener(type, fn);
      });
      unlockListenersRef.current = [];
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (userSpeechTimerRef.current) {
      clearTimeout(userSpeechTimerRef.current);
      userSpeechTimerRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;

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
    const currentApiKey = apiKeyRef.current;
    if (!currentApiKey) {
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
    voiceStateRef.current = 'CONNECTING';

    if (!isReconnect) {
      reconnectAttemptsRef.current = 0;
      resumptionHandleRef.current = null;
      greetingSentRef.current = false;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (userSpeechTimerRef.current) {
      clearTimeout(userSpeechTimerRef.current);
      userSpeechTimerRef.current = null;
    }

    const ctxCapture = { input: null, playback: null };

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
      voiceStateRef.current = 'DISCONNECTED';
    };

    const scheduleReconnect = (closedConnectionId, code, reason) => {
      if (code === 1007) {
        console.error(`Gemini Live model or audio configuration is not supported (code 1007): ${reason || 'Invalid configuration'}. Reconnect aborted.`);
        setError(`Gemini Live model or audio configuration is not supported (code 1007).`);
        disconnect();
        return;
      }
      const FATAL_CLOSE_CODES = [1002, 1003, 1008, 1009, 1010, 1015];
      if (FATAL_CLOSE_CODES.includes(code)) {
        console.error(`Gemini Live fatal error (code ${code}): API key or endpoint configuration is invalid. Reconnect aborted.`);
        setError(`Voice service configuration error (code ${code}). Please check API settings.`);
        disconnect();
        return;
      }
      if (!shouldReconnectRef.current) {
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

    const handleFunctionCall = (fc) => {
      if (!fc) return;
      let responseText = "Done.";
      try {
        if (fc.name === "report_patient_condition") {
          console.log("CRISIS DETECTED BY AI:", fc.args);
          if (fc.args) {
            reportedConditionsRef.current.push(fc.args);
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

      try {
        const functionResponse = {
          name: fc.name,
          response: { result: responseText },
        };
        if (fc.id) functionResponse.id = fc.id;
        const activeSession = sessionRef.current;
        if (activeSession) {
          activeSession.sendToolResponse({
            functionResponses: [functionResponse],
          });
        }
      } catch (e) {
        console.error("[AROHAN_LIVE] Error sending tool response:", e);
      }
    };

    try {
      console.log('[AROHAN_LIVE] CALL_START', { isReconnect });
      // 1. Initialize Web Audio Contexts
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      ctxCapture.input = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = ctxCapture.input;
      console.log('[AROHAN_LIVE] CAPTURE_CONTEXT_STATE', ctxCapture.input.state, 'sampleRate=' + ctxCapture.input.sampleRate);
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      ctxCapture.playback = new AudioContextClass();
      playbackContextRef.current = ctxCapture.playback;
      console.log('[AROHAN_LIVE] PLAYBACK_CONTEXT_STATE', ctxCapture.playback.state, 'sampleRate=' + ctxCapture.playback.sampleRate);

      if (playbackContextRef.current.state === 'suspended') {
        playbackContextRef.current.resume().catch(() => {});
      }

      // Add user gesture unlock listeners
      const unlockPlayback = () => {
        if (playbackContextRef.current && playbackContextRef.current.state === 'suspended') {
          playbackContextRef.current.resume().catch(() => {});
        }
      };
      ['click', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlockPlayback, { passive: true });
        unlockListenersRef.current.push({ type: evt, fn: unlockPlayback });
      });

      // 2. Load AudioWorklet module
      try {
        await audioContextRef.current.audioWorklet.addModule('/worklets/pcm-processor.js');
        console.log('[AROHAN_LIVE] WORKLET_CREATED', 'from /worklets/pcm-processor.js');
      } catch (err) {
        console.warn("AudioWorklet module load failed from /worklets, trying blob fallback:", err.message);
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        try {
          await audioContextRef.current.audioWorklet.addModule(workletUrl);
          console.log('[AROHAN_LIVE] WORKLET_CREATED', 'from blob fallback');
        } catch (err2) {
          console.error("AudioWorklet module load aborted/failed:", err2.message);
        }
      }

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
      console.log('[AROHAN_LIVE] MIC_ACQUIRED', 'tracks=' + stream.getAudioTracks().length);

      if (connectionIdRef.current !== myConnectionId) {
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        if (ctxCapture.input && ctxCapture.input.state !== 'closed') ctxCapture.input.close().catch(() => {});
        if (ctxCapture.playback && ctxCapture.playback.state !== 'closed') ctxCapture.playback.close().catch(() => {});
        isConnectingRef.current = false;
        return;
      }

      // 4. Connect to Google GenAI Live Socket
      console.log('[AROHAN_LIVE] WS_CONNECTING');
      const ai = new GoogleGenAI({
        apiKey: currentApiKey,
        httpOptions: { apiVersion: 'v1beta' }
      });

      let lastMicLogTime = 0;
      let lastSentLogTime = 0;

      const connectedSession = await ai.live.connect({
        model: "models/gemini-2.5-flash-native-audio-latest",
        config: {
          responseModalities: ["AUDIO"],
          systemInstruction: {
            parts: [{ text: customInstructionRef.current || "You are AAROHAN, a warm, supportive counselor and a deeply empathetic friend for victims in India, grounded in Indian law. In every reply: FIRST validate their feeling in one natural sentence (never use cliches like 'I am here for you'), THEN empower them — if an Indian law clearly applies (Constitution Art. 14/15/21, free legal aid under Art. 39A, defamation, criminal intimidation, IT Act for cybercrime, POCSO, Domestic Violence Act, SC/ST Act, anti-ragging UGC rules), say briefly that the law is on their side and name it; never invent section numbers. END with one concrete next step (FIR at any police station, cybercrime.gov.in, NALSA helpline 15100, Tele-MANAS 14416) or one gentle question. Keep every reply 2-3 short spoken sentences. Speak kindly and naturally. You MUST regularly call the report_patient_condition tool if you detect any signs of self-harm, suicidal ideation, or severe distress. You may call the log_conversation_turn tool to log the interaction, but ALWAYS speak your full supportive voice response to the user first without waiting or blocking audio for tool calls. When the call first starts, immediately introduce yourself as their supportive counselor from Aarohan and ask how they are feeling today." }]
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
              endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
              prefixPaddingMs: 40,
              silenceDurationMs: 200,
            },
            activityHandling: 'START_OF_ACTIVITY_INTERRUPTS',
          },
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
                  description: "Call this to log the interaction in the counselor's dashboard after speaking to the user.",
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
            console.log('[AROHAN_LIVE] WS_OPEN');
            console.log("Gemini Live connection established");
            setIsConnected(true);
            voiceStateRef.current = 'CONNECTED_IDLE';

            if (!callStartTimeRef.current) {
              callStartTimeRef.current = Date.now();
            }
            if (!isReconnect) {
              reportedConditionsRef.current = [];
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
                if (connectionIdRef.current !== myConnectionId) return;
                const message = e.data;
                if (message.type === 'audio') {
                  const pcmBlob = createPcmBlob(message.data);
                  const activeSession = sessionRef.current;
                  if (!activeSession) return;

                  try {
                    activeSession.sendRealtimeInput({ media: pcmBlob });

                    // Measure RMS volume
                    let sum = 0;
                    const rawSamples = message.data;
                    for (let i = 0; i < rawSamples.length; i++) {
                      sum += rawSamples[i] * rawSamples[i];
                    }
                    const rms = Math.sqrt(sum / rawSamples.length);

                    const nowT = performance.now();
                    if (nowT - lastMicLogTime > 800) {
                      console.log('[AROHAN_LIVE] PCM_MIC_CHUNK', rawSamples.length, 'samples, rms=' + rms.toFixed(4));
                      lastMicLogTime = nowT;
                    }
                    if (nowT - lastSentLogTime > 800) {
                      console.log('[AROHAN_LIVE] MIC_PCM_SENT');
                      lastSentLogTime = nowT;
                    }

                    if (rms > 0.012) {
                      // User speaking detected
                      voiceStateRef.current = 'USER_SPEAKING';
                      lastMeaningfulSpeechRef.current = performance.now();

                      const now = performance.now();
                      if (!diagRef.current.speechStart) diagRef.current.speechStart = now;
                      diagRef.current.speechEnd = now;
                      diagRef.current.isActiveTurn = true;

                      // Cancel timers while user is speaking
                      if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                      }
                      if (userSpeechTimerRef.current) {
                        clearTimeout(userSpeechTimerRef.current);
                        userSpeechTimerRef.current = null;
                      }
                    } else if (voiceStateRef.current === 'USER_SPEAKING') {
                      // User pause / speech end detected
                      if (!userSpeechTimerRef.current) {
                        userSpeechTimerRef.current = setTimeout(() => {
                          userSpeechTimerRef.current = null;
                          if (voiceStateRef.current === 'USER_SPEAKING') {
                            voiceStateRef.current = 'WAITING_FOR_GEMINI';
                          }
                        }, 400);
                      }
                    }
                  } catch (error) {
                    console.error('[AROHAN_LIVE] Error sending audio:', error);
                  }
                }
              };

              source.connect(workletNodeRef.current);
              workletNodeRef.current.connect(audioContextRef.current.destination);
            }
          },
          onmessage: (message) => {
            if (connectionIdRef.current !== myConnectionId) return;
            console.log('[AROHAN_LIVE] GEMINI_MESSAGE_RECEIVED', Object.keys(message));

            if (message.setupComplete) {
              setupCompleteRef.current = true;
              console.log('[AROHAN_LIVE] SETUP_COMPLETE');
              sendInitialGreetingIfReady();
            }

            if (message.sessionResumptionUpdate?.resumable && message.sessionResumptionUpdate.newHandle) {
              resumptionHandleRef.current = message.sessionResumptionUpdate.newHandle;
            }

            if (message.goAway) {
              console.log("Gemini Live: goAway received, closing for reconnect");
              try { sessionRef.current?.close(); } catch (e) {}
              return;
            }

            // Handle Interruption / Barge-in
            if (message.serverContent?.interrupted) {
              console.log('[AROHAN_LIVE] INTERRUPTED');
              activeAudioNodesRef.current.forEach(node => {
                try { node.stop(); } catch (e) {}
              });
              activeAudioNodesRef.current = [];
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              isNewTurnRef.current = true;

              if (playbackContextRef.current) {
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
              }
              voiceStateRef.current = 'INTERRUPTED';
            }

            // Handle Audio Playback
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                  const pcmData = part.inlineData.data;
                  if (pcmData) {
                    console.log('[AROHAN_LIVE] MODEL_AUDIO_RECEIVED', pcmData.length, 'base64 chars');
                    if (silenceTimerRef.current) {
                      clearTimeout(silenceTimerRef.current);
                      silenceTimerRef.current = null;
                    }
                    if (userSpeechTimerRef.current) {
                      clearTimeout(userSpeechTimerRef.current);
                      userSpeechTimerRef.current = null;
                    }
                    if (diagRef.current.isActiveTurn && !diagRef.current.firstAudioReceived) {
                      diagRef.current.firstAudioReceived = performance.now();
                    }
                    playPCMChunk(pcmData);
                  }
                } else if (part.functionCall) {
                  handleFunctionCall(part.functionCall);
                }
              }
            }

            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                handleFunctionCall(fc);
              }
            }

            if (message.serverContent?.turnComplete) {
              console.log('[AROHAN_LIVE] TURN_COMPLETE');
              isNewTurnRef.current = true;
              if (activeAudioNodesRef.current.length === 0) {
                voiceStateRef.current = 'CONNECTED_IDLE';
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                resetSilenceTimer();
              }
            }
          },
          onclose: (event) => {
            if (connectionIdRef.current !== myConnectionId) return;
            console.log('[AROHAN_LIVE] WS_CLOSED', event?.code, event?.reason);
            console.log("Gemini Live Session Closed", event?.code, event?.reason);
            setIsConnected(false);
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            teardownConnection();
            scheduleReconnect(myConnectionId, event?.code, event?.reason);
          },
          onerror: (err) => {
            if (connectionIdRef.current !== myConnectionId) return;
            console.error('[AROHAN_LIVE] ERROR', err);
            console.error("Gemini Live Session Error", err);
          }
        }
      });

      if (connectionIdRef.current !== myConnectionId) {
        try { connectedSession.close(); } catch (e) {}
        isConnectingRef.current = false;
        return;
      }

      sessionRef.current = connectedSession;
      console.log('[AROHAN_LIVE] SESSION_ASSIGNED');
      isConnectingRef.current = false;

      if (!isReconnect) {
        sendInitialGreetingIfReady();
      }

    } catch (err) {
      if (connectionIdRef.current === myConnectionId) {
        console.error('[AROHAN_LIVE] ERROR', err);
        setError("Setup failed: " + err.message);
        isConnectingRef.current = false;
      }
    }
  }, [disconnect, resetSilenceTimer, sendInitialGreetingIfReady]);

  return { isConnected, error, connect, disconnect, isSpeaking };
}
