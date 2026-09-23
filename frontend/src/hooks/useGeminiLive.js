import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { arbiter } from '../utils/audioAuthority';

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
// "now" so small network hiccups don't cause audible gaps.
// Tuned to 40ms for ultra-low latency initial audio start while avoiding buffer underruns.
const PLAYBACK_PREBUFFER_S = 0.04;

// ============================================================================
// LANGUAGE NORMALIZATION & CANONICAL INSTRUCTION GENERATOR
// ============================================================================
export const normalizeLanguage = (rawLang) => {
  if (!rawLang || typeof rawLang !== 'string') return 'en';
  const l = rawLang.toLowerCase().trim();
  if (l.startsWith('hi') || l.includes('hindi') || l.includes('हिंदी')) return 'hi';
  if (l.startsWith('te') || l.includes('telugu') || l.includes('తెలుగు')) return 'te';
  if (l.startsWith('en') || l.includes('english') || l.includes('अंग्रेज़ी')) return 'en';
  return 'en';
};

const getSystemInstructionForLanguage = (langCode) => {
  if (langCode === 'hi') {
    return `You are AAROHAN AI, a warm, supportive counselor and a deeply empathetic friend for victims in India, grounded in Indian law. Speak kindly, warmly, and naturally.

SESSION LANGUAGE LOCK: HINDI (हिंदी)
- You must communicate EXCLUSIVELY in natural, empathetic Hindi (हिंदी) for this ENTIRE voice session.
- NEVER switch to English, Telugu, or any other language, even if the user speaks other words.
- NEVER produce multilingual responses or repeat the same sentence in another language.
- Speak pure, natural, conversational Hindi.

CONVERSATION FLOW:
1. GREETING: When the call starts, you will receive a System trigger. Introduce yourself once warmly as their counselor from Aarohan in Hindi and ask how they are feeling today.
2. SUBSEQUENT TURNS: After the initial greeting, NEVER introduce yourself again and NEVER restart with a greeting. Continue the conversation naturally based on the latest user utterance.
3. IN EVERY RESPONSE:
   - First validate their feeling in one natural spoken Hindi sentence.
   - If an Indian law applies (Constitution Art. 14/15/21, free legal aid Art. 39A, IT Act for cybercrime, POCSO, Domestic Violence Act, SC/ST Act, anti-ragging UGC rules), state briefly in Hindi that the law is on their side without inventing section numbers.
   - End with one concrete next step (FIR at any police station, cybercrime.gov.in, NALSA helpline 15100, Tele-MANAS 14416) OR one gentle conversational question.
4. Keep replies 2-3 short, natural spoken sentences for smooth real-time voice flow.

CRISIS MANDATE:
- Call the report_patient_condition tool immediately if you detect signs of self-harm, suicidal ideation, or severe danger.
- You may call log_conversation_turn to record the turn, but ALWAYS speak your full supportive voice response without waiting or blocking audio for tool calls.`;
  }

  if (langCode === 'te') {
    return `You are AAROHAN AI, a warm, supportive counselor and a deeply empathetic friend for victims in India, grounded in Indian law. Speak kindly, warmly, and naturally.

SESSION LANGUAGE LOCK: TELUGU (తెలుగు)
- You must communicate EXCLUSIVELY in natural, empathetic Telugu (తెలుగు) for this ENTIRE voice session.
- NEVER switch to English, Hindi, or any other language, even if the user speaks other words.
- NEVER produce multilingual responses or repeat the same sentence in another language.
- Speak pure, natural, conversational Telugu.

CONVERSATION FLOW:
1. GREETING: When the call starts, you will receive a System trigger. Introduce yourself once warmly as their counselor from Aarohan in Telugu and ask how they are feeling today.
2. SUBSEQUENT TURNS: After the initial greeting, NEVER introduce yourself again and NEVER restart with a greeting. Continue the conversation naturally based on the latest user utterance.
3. IN EVERY RESPONSE:
   - First validate their feeling in one natural spoken Telugu sentence.
   - If an Indian law applies (Constitution Art. 14/15/21, free legal aid Art. 39A, IT Act for cybercrime, POCSO, Domestic Violence Act, SC/ST Act, anti-ragging UGC rules), state briefly in Telugu that the law is on their side without inventing section numbers.
   - End with one concrete next step (FIR at any police station, cybercrime.gov.in, NALSA helpline 15100, Tele-MANAS 14416) OR one gentle conversational question.
4. Keep replies 2-3 short, natural spoken sentences for smooth real-time voice flow.

CRISIS MANDATE:
- Call the report_patient_condition tool immediately if you detect signs of self-harm, suicidal ideation, or severe danger.
- You may call log_conversation_turn to record the turn, but ALWAYS speak your full supportive voice response without waiting or blocking audio for tool calls.`;
  }

  // Default: English ('en')
  return `You are AAROHAN AI, a warm, supportive counselor and a deeply empathetic friend for victims in India, grounded in Indian law. Speak kindly, warmly, and naturally.

SESSION LANGUAGE LOCK: ENGLISH
- You must communicate EXCLUSIVELY in natural, empathetic English for this ENTIRE voice session.
- NEVER switch to Hindi, Telugu, or any other language.
- NEVER produce multilingual responses or repeat the same sentence in another language.
- Speak natural, conversational English.

CONVERSATION FLOW:
1. GREETING: When the call starts, you will receive a System trigger. Introduce yourself once warmly as their counselor from Aarohan in English and ask how they are feeling today.
2. SUBSEQUENT TURNS: After the initial greeting, NEVER introduce yourself again and NEVER restart with a greeting. Continue the conversation naturally based on the latest user utterance.
3. IN EVERY RESPONSE:
   - First validate their feeling in one natural spoken English sentence (never use robotic cliches like "I am here for you").
   - If an Indian law applies (Constitution Art. 14/15/21, free legal aid under Art. 39A, defamation, criminal intimidation, IT Act for cybercrime, POCSO, Domestic Violence Act, SC/ST Act, anti-ragging UGC rules), state briefly that the law is on their side without inventing section numbers.
   - End with one concrete next step (FIR at any police station, cybercrime.gov.in, NALSA helpline 15100, Tele-MANAS 14416) OR one gentle conversational question.
4. Keep replies 2-3 short, natural spoken sentences for smooth real-time voice flow.

CRISIS MANDATE:
- Call the report_patient_condition tool immediately if you detect signs of self-harm, suicidal ideation, or severe danger.
- You may call log_conversation_turn to record the turn, but ALWAYS speak your full supportive voice response without waiting or blocking audio for tool calls.`;
};

// ============================================================================
// GLOBAL APPLICATION-WIDE VOICE COORDINATOR SINGLETON
// Enforces that exactly ONE Gemini Live session, ONE AudioContext, ONE mic stream,
// ONE locked language, ONE turn generation sequence, and ONE greeting can exist.
// ============================================================================
const GlobalVoice = {
  activeOwnerId: null,
  activeConnectionId: 0,
  activeLanguage: 'en',
  activeTurnId: 0,
  currentModelTurnId: 0,
  activeResponseId: null,
  seenResponseIds: new Set(),
  chunkIndexInTurn: 0,
  activeSession: null,
  inputContext: null,
  playbackContext: null,
  mediaStream: null,
  workletNode: null,
  activeAudioNodes: [],
  nextPlayTime: 0,
  isNewTurn: true,
  greetingSentConnectionId: 0,
  reconnectTimer: null,
  liveVoiceActive: false,
  micInputEnabled: false,
  userTurnActive: false,
  idleTimelineTimer: null,
  state: 'IDLE', // 'IDLE' | 'CONNECTING' | 'SETUP' | 'GREETING' | 'LISTENING' | 'THINKING' | 'AI_SPEAKING' | 'USER_INTERRUPTED' | 'DISCONNECTING' | 'CLOSED'
};

if (typeof window !== 'undefined') {
  window.__AAROHAN_GLOBAL_VOICE__ = GlobalVoice;
}

const teardownGlobalSession = (reason = "manual") => {
  const oldConnId = GlobalVoice.activeConnectionId;
  const oldOwner = GlobalVoice.activeOwnerId;

  GlobalVoice.liveVoiceActive = false;
  GlobalVoice.micInputEnabled = false;
  GlobalVoice.userTurnActive = false;
  GlobalVoice.state = 'CLOSED';

  if (GlobalVoice.reconnectTimer) {
    clearTimeout(GlobalVoice.reconnectTimer);
    GlobalVoice.reconnectTimer = null;
  }

  if (GlobalVoice.idleTimelineTimer) {
    clearTimeout(GlobalVoice.idleTimelineTimer);
    GlobalVoice.idleTimelineTimer = null;
  }

  GlobalVoice.activeAudioNodes.forEach(node => {
    try { node.stop(); } catch (e) {}
  });
  GlobalVoice.activeAudioNodes = [];
  GlobalVoice.nextPlayTime = 0;
  GlobalVoice.isNewTurn = true;
  GlobalVoice.activeTurnId += 1; // Invalidate any remaining in-flight audio turns
  GlobalVoice.activeResponseId = null;
  GlobalVoice.seenResponseIds.clear();
  GlobalVoice.chunkIndexInTurn = 0;

  if (GlobalVoice.workletNode) {
    try { GlobalVoice.workletNode.disconnect(); } catch (e) {}
    GlobalVoice.workletNode = null;
  }

  if (GlobalVoice.mediaStream) {
    GlobalVoice.mediaStream.getTracks().forEach(t => t.stop());
    GlobalVoice.mediaStream = null;
  }

  if (GlobalVoice.inputContext && GlobalVoice.inputContext.state !== 'closed') {
    GlobalVoice.inputContext.close().catch(() => {});
  }
  GlobalVoice.inputContext = null;

  if (GlobalVoice.playbackContext && GlobalVoice.playbackContext.state !== 'closed') {
    GlobalVoice.playbackContext.close().catch(() => {});
  }
  GlobalVoice.playbackContext = null;

  if (GlobalVoice.activeSession) {
    try { GlobalVoice.activeSession.close(); } catch (e) {}
    GlobalVoice.activeSession = null;
  }

  GlobalVoice.activeOwnerId = null;
  GlobalVoice.activeConnectionId = 0;
  GlobalVoice.greetingSentConnectionId = 0;
  GlobalVoice.activeLanguage = 'en';
  GlobalVoice.state = 'IDLE';

  arbiter.releaseLiveAudio(reason);
  console.log('[AROHAN_AUDIO] LIVE_AUDIO_RELEASED', `reason=${reason}`, `instance=${oldOwner}`);
  console.log('[AROHAN_VOICE] CONNECTION_CLOSE', `reason=${reason}`, `connId=${oldConnId}`);
  console.log('[AROHAN_VOICE] TEARDOWN', `reason=${reason}`, `instance=${oldOwner}`);
};

const acquireGlobalVoiceLock = (instanceId, rawLanguage) => {
  teardownGlobalSession("new_acquisition");

  // Global Audio Authority: liveVoiceActive is set true BEFORE any Live audio/WS begins
  GlobalVoice.liveVoiceActive = true;

  const newConnectionId = Date.now() + Math.random();
  const lockedLang = normalizeLanguage(rawLanguage);

  arbiter.acquireLiveAudioGeneration({
    connectionId: newConnectionId,
    turnId: 1,
    reason: 'new_session_lock'
  });

  console.log('[AROHAN_AUDIO] LIVE_AUDIO_ACQUIRED', `instance=${instanceId}`);

  GlobalVoice.activeOwnerId = instanceId;
  GlobalVoice.activeConnectionId = newConnectionId;
  GlobalVoice.activeLanguage = lockedLang;
  GlobalVoice.activeTurnId = 1;
  GlobalVoice.currentModelTurnId = 1;
  GlobalVoice.activeResponseId = null;
  GlobalVoice.seenResponseIds = new Set();
  GlobalVoice.chunkIndexInTurn = 0;
  GlobalVoice.greetingSentConnectionId = 0;
  GlobalVoice.nextPlayTime = 0;
  GlobalVoice.isNewTurn = true;
  GlobalVoice.micInputEnabled = false;
  GlobalVoice.userTurnActive = false;
  GlobalVoice.state = 'CONNECTING';

  console.log('[AROHAN_VOICE] CONNECTION_CREATE', `connId=${newConnectionId}`, `lockedLanguage=${lockedLang}`, 'turnId=1');
  return newConnectionId;
};

export default function useGeminiLive(apiKey, language = "en-IN") {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const instanceIdRef = useRef('inst_' + Math.random().toString(36).substr(2, 9));

  // Unified State Machine:
  // DISCONNECTED | CONNECTING | CONNECTED_IDLE | USER_SPEAKING | WAITING_FOR_GEMINI | AI_SPEAKING | INTERRUPTED
  const voiceStateRef = useRef('DISCONNECTED');
  const isSpeakingRef = useRef(false);

  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;
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

  // Structured Telemetry
  const metricsRef = useRef({
    wsConnectStart: null,
    wsOpenTime: null,
    greetingSentTime: null,
    greetingFirstAudioTime: null,
    bargeInSpeechTime: null,
    turnCount: 0,
    currentTurn: {
      id: 0,
      t0_speechStart: null,
      t1_speechEnd: null,
      t2_firstAudioReceived: null,
      t3_firstAudioScheduled: null,
      t4_estimatedPlayStart: null,
      chunkArrivalTimes: [],
      chunkCount: 0,
    }
  });

  // Preallocated buffer for PCM encoding to eliminate per-frame GC pressure
  const inputInt16Ref = useRef(new Int16Array(1024));

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
    if (!inputInt16Ref.current || inputInt16Ref.current.length !== l) {
      inputInt16Ref.current = new Int16Array(l);
    }
    const int16 = inputInt16Ref.current;
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: base64Encode(new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength)),
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
        const activeSession = GlobalVoice.activeSession;
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
            console.error("[AROHAN_VOICE] Error sending silence check:", e);
          }
        }
      }, 25000);
    }
  }, []);

  const playPCMChunk = async (base64PCM, myConnectionId, turnId, responseId, chunkIdx) => {
    const currentGen = arbiter.getGenerationId();

    if (
      GlobalVoice.activeConnectionId !== myConnectionId ||
      !GlobalVoice.activeSession ||
      turnId !== GlobalVoice.activeTurnId ||
      arbiter.getGenerationId() !== currentGen
    ) {
      console.log(
        '[AROHAN_REALTIME] STALE_RESPONSE_DROPPED',
        `turn=${turnId}`,
        `activeTurn=${GlobalVoice.activeTurnId}`,
        `gen=${currentGen}`,
        `activeGen=${arbiter.getGenerationId()}`,
        `responseId=${responseId}`
      );
      return;
    }

    try {
      const bytes = base64Decode(base64PCM);
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      let ctx = GlobalVoice.playbackContext;
      if (!ctx || ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContextClass();
        GlobalVoice.playbackContext = ctx;
        playbackContextRef.current = ctx;
      }

      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (e) {
          console.warn("[useGeminiLive] Playback context resume deferred:", e);
        }
      }

      // POST-AWAIT OWNERSHIP & GENERATION VALIDATION
      if (
        GlobalVoice.activeConnectionId !== myConnectionId ||
        !GlobalVoice.activeSession ||
        turnId !== GlobalVoice.activeTurnId ||
        GlobalVoice.playbackContext !== ctx ||
        arbiter.getGenerationId() !== currentGen
      ) {
        console.log(
          '[AROHAN_REALTIME] STALE_RESPONSE_DROPPED',
          'reason=post_resume_validation',
          `turn=${turnId}`,
          `activeTurn=${GlobalVoice.activeTurnId}`,
          `gen=${currentGen}`,
          `activeGen=${arbiter.getGenerationId()}`,
          `responseId=${responseId}`
        );
        return;
      }

      const buffer = ctx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const scheduleResult = arbiter.scheduleWebAudioNode({
        node: source,
        generationId: currentGen,
        connectionId: myConnectionId,
        turnId,
        responseId,
        duration: buffer.duration,
        ctx,
        prebufferS: PLAYBACK_PREBUFFER_S
      });

      if (!scheduleResult) {
        console.log(
          '[VOICE_RESPONSE] AUDIO_DROPPED',
          `turn=${turnId}`,
          `response=${responseId}`,
          `chunk=${chunkIdx}`,
          'reason=scheduler_rejected'
        );
        return;
      }

      console.log(
        '[VOICE_RESPONSE] AUDIO_ACCEPTED',
        `turn=${turnId}`,
        `response=${responseId}`,
        `chunk=${chunkIdx}`,
        `duration=${buffer.duration.toFixed(3)}s`
      );

      GlobalVoice.activeAudioNodes.push(source);
      activeAudioNodesRef.current = GlobalVoice.activeAudioNodes;

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      voiceStateRef.current = 'AI_SPEAKING';
      GlobalVoice.state = 'AI_SPEAKING';

      if (GlobalVoice.idleTimelineTimer) {
        clearTimeout(GlobalVoice.idleTimelineTimer);
        GlobalVoice.idleTimelineTimer = null;
      }

      const prevOnEnded = source.onended;
      source.onended = () => {
        if (typeof prevOnEnded === 'function') {
          prevOnEnded();
        }
        GlobalVoice.activeAudioNodes = GlobalVoice.activeAudioNodes.filter((n) => n !== source);
        activeAudioNodesRef.current = GlobalVoice.activeAudioNodes;
        const remainingQueue = GlobalVoice.activeAudioNodes.length;
        if (remainingQueue === 0) {
          console.log('[VOICE_RESPONSE] AUDIO_DRAIN_COMPLETE', `turn=${turnId}`);
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          
          if (GlobalVoice.idleTimelineTimer) {
            clearTimeout(GlobalVoice.idleTimelineTimer);
          }
          GlobalVoice.idleTimelineTimer = setTimeout(() => {
            GlobalVoice.idleTimelineTimer = null;
            if (GlobalVoice.activeAudioNodes.length === 0) {
              if (voiceStateRef.current === 'AI_SPEAKING' || voiceStateRef.current === 'INTERRUPTED') {
                voiceStateRef.current = 'CONNECTED_IDLE';
                GlobalVoice.state = 'LISTENING';
                resetSilenceTimer();
              }
            }
          }, 150);
        }
      };

      // Telemetry calculation for first scheduled chunk of turn
      const cur = metricsRef.current.currentTurn;
      if (cur.t2_firstAudioReceived && !cur.t3_firstAudioScheduled) {
        cur.t3_firstAudioScheduled = performance.now();
        const outputLatencySec = (ctx && typeof ctx.outputLatency === 'number') ? ctx.outputLatency : 0;
        const delayToScheduled = Math.max(0, scheduleResult.scheduledStart - ctx.currentTime);
        cur.t4_estimatedPlayStart = cur.t3_firstAudioScheduled + (delayToScheduled + outputLatencySec) * 1000;

        const speechDur = cur.t1_speechEnd && cur.t0_speechStart ? (cur.t1_speechEnd - cur.t0_speechStart).toFixed(0) : '0';
        const modelTurnaround = cur.t1_speechEnd ? (cur.t2_firstAudioReceived - cur.t1_speechEnd).toFixed(0) : '0';
        const clientSched = (cur.t3_firstAudioScheduled - cur.t2_firstAudioReceived).toFixed(0);
        const schedDelay = (cur.t4_estimatedPlayStart - cur.t3_firstAudioScheduled).toFixed(0);
        const speechEndToFirstPlayback = cur.t1_speechEnd ? (cur.t4_estimatedPlayStart - cur.t1_speechEnd).toFixed(0) : '0';
        const speechEndToFirstChunk = cur.t1_speechEnd ? (cur.t2_firstAudioReceived - cur.t1_speechEnd).toFixed(0) : '0';

        console.log(`[VOICE_LATENCY] FIRST_AUDIO_SCHEDULED turn=${cur.id} genId=${currentGen} schedDelay=${schedDelay}ms`);
        console.log(`[VOICE_LATENCY] FIRST_AUDIO_PLAYBACK turn=${cur.id} genId=${currentGen} speechEndToFirstChunk=${speechEndToFirstChunk}ms speechEndToFirstPlayback=${speechEndToFirstPlayback}ms target=<=2000ms`);

        console.log(`\n[VOICE_METRICS] Turn #${cur.id} Latency Breakdown:`);
        console.log(`  T0 (User Speech Start):         ${cur.t0_speechStart ? cur.t0_speechStart.toFixed(0) : 'N/A'} ms`);
        console.log(`  T1 (User Speech End):           ${cur.t1_speechEnd ? cur.t1_speechEnd.toFixed(0) : 'N/A'} ms (Duration: ${speechDur} ms)`);
        console.log(`  T2 (First Audio Received):      ${cur.t2_firstAudioReceived.toFixed(0)} ms (Model Turnaround: ${modelTurnaround} ms)`);
        console.log(`  T3 (First Audio Scheduled):     ${cur.t3_firstAudioScheduled.toFixed(0)} ms (Client Sched: ${clientSched} ms)`);
        console.log(`  T4 (Estimated Playback Start):  ${cur.t4_estimatedPlayStart.toFixed(0)} ms (Buffer Delay: ${schedDelay} ms)`);
        console.log(`  Total Perceived Turn Latency:   ${speechEndToFirstPlayback} ms\n`);
      }
    } catch (e) {
      console.error("[AROHAN_VOICE] ERROR in playPCMChunk:", e);
    }
  };

  const sendInitialGreetingIfReady = useCallback((targetConnectionId) => {
    const connId = targetConnectionId;
    if (!connId || connId !== GlobalVoice.activeConnectionId) {
      console.log("[AROHAN_VOICE] Greeting rejected: not active global connection", "target=" + connId, "active=" + GlobalVoice.activeConnectionId);
      return false;
    }

    const activeSession = GlobalVoice.activeSession;
    if (!activeSession) {
      console.log("[AROHAN_VOICE] Greeting waiting for session assignment", "connId=" + connId);
      return false;
    }

    if (!setupCompleteRef.current) {
      console.log("[AROHAN_VOICE] Greeting waiting for setupComplete", "connId=" + connId);
      return false;
    }

    if (GlobalVoice.greetingSentConnectionId === connId) {
      return true;
    }

    try {
      GlobalVoice.greetingSentConnectionId = connId;
      greetingSentRef.current = true;
      GlobalVoice.activeTurnId = 1;
      GlobalVoice.currentModelTurnId = 1;
      GlobalVoice.micInputEnabled = true;
      GlobalVoice.state = 'GREETING';
      metricsRef.current.greetingSentTime = performance.now();

      const activeLang = GlobalVoice.activeLanguage;
      const greetingPrompts = {
        hi: "System trigger: The user has just connected to the voice call. Please speak first, greet them warmly in pure Hindi (हिंदी) as their counselor from Aarohan, and ask how they are feeling today.",
        te: "System trigger: The user has just connected to the voice call. Please speak first, greet them warmly in pure Telugu (తెలుగు) as their counselor from Aarohan, and ask how they are feeling today.",
        en: "System trigger: The user has just connected to the voice call. Please speak first, greet them warmly in English as their counselor from Aarohan, and ask how they are feeling today."
      };
      const greetingPrompt = greetingPrompts[activeLang] || greetingPrompts.en;

      activeSession.sendClientContent({
        turns: [{
          role: "user",
          parts: [{
            text: greetingPrompt
          }]
        }],
        turnComplete: true
      });

      console.log('[AROHAN_VOICE] GREETING_SENT', `connectionId=${connId}`, 'turnId=1', `language=${activeLang}`);
      return true;
    } catch (error) {
      console.error("[AROHAN_VOICE] GREETING_SEND_FAILED", error);
      return false;
    }
  }, []);

  // Full teardown + end-of-call logging
  const disconnect = useCallback(() => {
    const oldConnId = connectionIdRef.current;
    isConnectingRef.current = false;
    connectionIdRef.current = 0;
    shouldReconnectRef.current = false;
    resumptionHandleRef.current = null;
    voiceStateRef.current = 'DISCONNECTED';
    GlobalVoice.state = 'DISCONNECTING';
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

    // Release global singleton if owned by this instance
    if (GlobalVoice.activeOwnerId === instanceIdRef.current || GlobalVoice.activeConnectionId === oldConnId) {
      teardownGlobalSession("disconnect_call");
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

    // Acquire global lock with normalized session language
    const myConnectionId = acquireGlobalVoiceLock(instanceIdRef.current, languageRef.current);
    connectionIdRef.current = myConnectionId;

    isConnectingRef.current = true;
    setError(null);
    shouldReconnectRef.current = true;
    voiceStateRef.current = 'CONNECTING';
    metricsRef.current.wsConnectStart = performance.now();

    console.log('[AROHAN_VOICE] CONNECTION_CREATE', `isReconnect=${isReconnect}`, `connectionId=${myConnectionId}`, `language=${GlobalVoice.activeLanguage}`);

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

    const scheduleReconnect = (closedConnectionId, code, reason) => {
      // 1. Verify that this closed connection is the current active connection generation and owned by this instance
      if (
        GlobalVoice.activeConnectionId !== closedConnectionId ||
        GlobalVoice.activeOwnerId !== instanceIdRef.current ||
        connectionIdRef.current !== closedConnectionId ||
        !shouldReconnectRef.current
      ) {
        console.log('[AROHAN_VOICE] STALE_OR_INTENTIONAL_CLOSE_IGNORED', 'id=' + closedConnectionId, 'activeId=' + GlobalVoice.activeConnectionId, 'code=' + code);
        return;
      }

      // 2. Fatal close code checks (only for active, unexpected disconnects)
      if (code === 1007) {
        console.error(`Gemini Live model or audio configuration is not supported (code 1007): ${reason || 'Invalid configuration'}. Reconnect aborted.`);
        setError(`Gemini Live model or audio configuration is not supported (code 1007).`);
        resumptionHandleRef.current = null;
        disconnect();
        return;
      }
      const FATAL_CLOSE_CODES = [1002, 1003, 1008, 1009, 1010, 1015];
      if (FATAL_CLOSE_CODES.includes(code)) {
        console.error(`Gemini Live fatal error (code ${code}): API key or endpoint configuration is invalid. Reconnect aborted.`);
        setError(`Voice service configuration error (code ${code}). Please check API settings.`);
        resumptionHandleRef.current = null;
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

      // 4. Safely tear down old audio/network resources for the old socket before scheduling
      teardownGlobalSession("ws_close_reconnect");

      // 5. Exponential backoff delay
      const delay = attempt === 1
        ? 400 + Math.random() * 300
        : Math.min(6000, 1200 * Math.pow(2, attempt - 2)) + Math.random() * 600;

      console.log('[AROHAN_VOICE] RECONNECT', `connectionId=${closedConnectionId}`, `attempt=${attempt}`, `delayMs=${Math.round(delay)}`, `code=${code}`);

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        // Verify user did not disconnect during the delay
        if (!shouldReconnectRef.current) return;
        connect({ isReconnect: true });
      }, delay);
      GlobalVoice.reconnectTimer = reconnectTimerRef.current;
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
        const activeSession = GlobalVoice.activeSession;
        if (activeSession) {
          activeSession.sendToolResponse({
            functionResponses: [functionResponse],
          });
        }
      } catch (e) {
        console.error("[AROHAN_VOICE] Error sending tool response:", e);
      }
    };

    try {
      // Step 1: Initialize Web Audio Contexts
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const playbackCtx = new AudioContextClass();
      GlobalVoice.inputContext = inputCtx;
      GlobalVoice.playbackContext = playbackCtx;
      audioContextRef.current = inputCtx;
      playbackContextRef.current = playbackCtx;

      if (inputCtx.state === 'suspended') inputCtx.resume().catch(() => {});
      if (playbackCtx.state === 'suspended') playbackCtx.resume().catch(() => {});

      // Add user gesture unlock listeners
      const unlockPlayback = () => {
        if (GlobalVoice.playbackContext && GlobalVoice.playbackContext.state === 'suspended') {
          GlobalVoice.playbackContext.resume().catch(() => {});
        }
      };
      ['click', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlockPlayback, { passive: true });
        unlockListenersRef.current.push({ type: evt, fn: unlockPlayback });
      });

      // Step 2: Load AudioWorklet module
      try {
        await inputCtx.audioWorklet.addModule('/worklets/pcm-processor.js');
      } catch (err) {
        console.warn("AudioWorklet module load failed from /worklets, trying blob fallback:", err.message);
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        try {
          await inputCtx.audioWorklet.addModule(workletUrl);
        } catch (err2) {
          console.error("AudioWorklet module load aborted/failed:", err2.message);
        }
      }

      if (GlobalVoice.activeConnectionId !== myConnectionId) {
        console.log('[AROHAN_VOICE] STALE_CONNECTION_DISPOSED', 'step=worklet', 'connId=' + myConnectionId);
        if (inputCtx.state !== 'closed') inputCtx.close().catch(() => {});
        if (playbackCtx.state !== 'closed') playbackCtx.close().catch(() => {});
        isConnectingRef.current = false;
        return;
      }

      // Step 3: Request mic permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      GlobalVoice.mediaStream = stream;
      mediaStreamRef.current = stream;

      if (GlobalVoice.activeConnectionId !== myConnectionId) {
        console.log('[AROHAN_VOICE] STALE_CONNECTION_DISPOSED', 'step=mic', 'connId=' + myConnectionId);
        stream.getTracks().forEach(t => t.stop());
        if (inputCtx.state !== 'closed') inputCtx.close().catch(() => {});
        if (playbackCtx.state !== 'closed') playbackCtx.close().catch(() => {});
        isConnectingRef.current = false;
        return;
      }

      // Step 4: Connect to Google GenAI Live Socket
      GlobalVoice.state = 'SETUP';
      const ai = new GoogleGenAI({
        apiKey: currentApiKey,
        httpOptions: { apiVersion: 'v1beta' }
      });

      let lastMicBlockedLogTime = 0;

      const connectedSession = await ai.live.connect({
        model: "models/gemini-2.5-flash-native-audio-latest",
        config: {
          responseModalities: ["AUDIO"],
          systemInstruction: {
            parts: [{ text: getSystemInstructionForLanguage(GlobalVoice.activeLanguage) }]
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
          sessionResumption: undefined,
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
            if (GlobalVoice.activeConnectionId !== myConnectionId) return;
            setError(null);
            metricsRef.current.wsOpenTime = performance.now();
            const connectDur = metricsRef.current.wsConnectStart ? (metricsRef.current.wsOpenTime - metricsRef.current.wsConnectStart).toFixed(0) : 'N/A';
            console.log(`[VOICE_METRICS] WS_CONNECTED duration=${connectDur}ms`);
            console.log('[AROHAN_VOICE] CONNECTION_ACTIVE', `connectionId=${myConnectionId}`, `language=${GlobalVoice.activeLanguage}`);
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

            // Connect microphone to AudioWorklet
            if (inputCtx && stream) {
              const source = inputCtx.createMediaStreamSource(stream);
              const workletNode = new AudioWorkletNode(inputCtx, 'pcm-processor');
              GlobalVoice.workletNode = workletNode;
              workletNodeRef.current = workletNode;

              workletNode.port.onmessage = (e) => {
                if (GlobalVoice.activeConnectionId !== myConnectionId) return;

                // CRITICAL GATING: Suppress mic PCM until greeting phase is completely ready
                if (!GlobalVoice.micInputEnabled) {
                  const nowT = performance.now();
                  if (nowT - lastMicBlockedLogTime > 2000) {
                    console.log('[AROHAN_VOICE] MIC_INPUT_BLOCKED', `reason=${GlobalVoice.state}`);
                    lastMicBlockedLogTime = nowT;
                  }
                  return;
                }

                const message = e.data;
                if (message.type === 'audio') {
                  const pcmBlob = createPcmBlob(message.data);
                  const activeSession = GlobalVoice.activeSession;
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

                    if (rms > 0.020) {
                      const now = performance.now();
                      if (!GlobalVoice.userTurnActive && !isSpeakingRef.current && voiceStateRef.current !== 'AI_SPEAKING') {
                        GlobalVoice.userTurnActive = true;

                        const oldTurn = GlobalVoice.activeTurnId;
                        GlobalVoice.activeTurnId += 1;
                        const newTurn = GlobalVoice.activeTurnId;
                        GlobalVoice.userTurnGeneration = (GlobalVoice.userTurnGeneration || 1) + 1;
                        const newGen = arbiter.acquireLiveAudioGeneration({
                          connectionId: myConnectionId,
                          turnId: newTurn,
                          reason: 'new_user_turn'
                        });

                        // Immediately invalidate previous response & clear old audio
                        GlobalVoice.activeResponseId = null;
                        GlobalVoice.isNewTurn = true;
                        isNewTurnRef.current = true;

                        console.log(
                          '[AROHAN_REALTIME] NEW_USER_TURN',
                          `turn=${newTurn}`,
                          `generation=${newGen}`
                        );
                        console.log(
                          '[VOICE_RESPONSE] START',
                          `turn=${newTurn}`,
                          `generation=${newGen}`
                        );

                        voiceStateRef.current = 'USER_SPEAKING';
                        GlobalVoice.state = 'LISTENING';
                        lastMeaningfulSpeechRef.current = now;

                        console.log(
                          '[VOICE_LATENCY] USER_SPEECH_START',
                          `turnId=${newTurn}`,
                          `connId=${myConnectionId}`,
                          `timestamp=${now.toFixed(0)}`
                        );
                        console.log(
                          '[AROHAN_VOICE] USER_SPEECH_ACTIVITY',
                          `connectionId=${myConnectionId}`,
                          `turnId=${newTurn}`,
                          `rms=${rms.toFixed(4)}`,
                          `language=${GlobalVoice.activeLanguage}`
                        );
                      }

                      if (isSpeakingRef.current && !metricsRef.current.bargeInSpeechTime) {
                        metricsRef.current.bargeInSpeechTime = now;
                      }

                      const cur = metricsRef.current.currentTurn;
                      if (!cur.t0_speechStart || cur.t3_firstAudioScheduled) {
                        metricsRef.current.turnCount += 1;
                        metricsRef.current.currentTurn = {
                          id: metricsRef.current.turnCount,
                          t0_speechStart: now,
                          t1_speechEnd: now,
                          t2_firstAudioReceived: null,
                          t3_firstAudioScheduled: null,
                          t4_estimatedPlayStart: null,
                          chunkArrivalTimes: [],
                          chunkCount: 0,
                        };
                      } else {
                        cur.t1_speechEnd = now;
                      }

                      if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                      }
                      if (userSpeechTimerRef.current) {
                        clearTimeout(userSpeechTimerRef.current);
                        userSpeechTimerRef.current = null;
                      }
                    } else if (GlobalVoice.userTurnActive) {
                      if (!userSpeechTimerRef.current) {
                        userSpeechTimerRef.current = setTimeout(() => {
                          userSpeechTimerRef.current = null;
                          if (GlobalVoice.userTurnActive) {
                            GlobalVoice.userTurnActive = false;
                            voiceStateRef.current = 'WAITING_FOR_GEMINI';
                            GlobalVoice.state = 'THINKING';
                            const nowEnd = performance.now();
                            console.log(
                              '[VOICE_LATENCY] USER_SPEECH_END',
                              `turnId=${GlobalVoice.activeTurnId}`,
                              `connId=${myConnectionId}`,
                              `timestamp=${nowEnd.toFixed(0)}`
                            );
                            console.log(
                              '[AROHAN_VOICE] USER_SPEECH_PAUSE',
                              `connectionId=${myConnectionId}`,
                              `turnId=${GlobalVoice.activeTurnId}`
                            );
                          }
                        }, 400);
                      }
                    }
                  } catch (error) {
                    console.error('[AROHAN_VOICE] Error sending audio:', error);
                  }
                }
              };

              source.connect(workletNode);
            }
          },
          onmessage: (message) => {
            if (GlobalVoice.activeConnectionId !== myConnectionId) return;

            if (message.setupComplete) {
              setupCompleteRef.current = true;
              console.log('[AROHAN_VOICE] SETUP_COMPLETE', 'connId=' + myConnectionId);
              sendInitialGreetingIfReady(myConnectionId);
            }

            if (message.goAway) {
              console.log("[AROHAN_VOICE] goAway received, closing for reconnect");
              try { connectedSession.close(); } catch (e) {}
              return;
            }

            // Handle Interruption / Barge-in
            if (message.serverContent?.interrupted) {
              const interruptedTime = performance.now();
              const bargeTime = metricsRef.current.bargeInSpeechTime;
              const bargeLatency = bargeTime ? (interruptedTime - bargeTime).toFixed(0) : 'N/A';
              metricsRef.current.bargeInSpeechTime = null;
              console.log(`[VOICE_METRICS] BARGE_IN_REACTION latency=${bargeLatency}ms`);

              const oldTurn = GlobalVoice.activeTurnId;
              GlobalVoice.activeTurnId += 1;
              const newTurn = GlobalVoice.activeTurnId;
              arbiter.invalidateAllAudio('server_vad_interruption');
              console.log('[VOICE_RESPONSE] BARGE_IN', `oldTurn=${oldTurn}`, `newTurn=${newTurn}`);
              console.log('[VOICE_RESPONSE] RESPONSE_CANCELLED', `turn=${oldTurn}`, 'reason=server_vad_interruption');

              GlobalVoice.activeAudioNodes = [];
              activeAudioNodesRef.current = [];
              if (GlobalVoice.idleTimelineTimer) {
                clearTimeout(GlobalVoice.idleTimelineTimer);
                GlobalVoice.idleTimelineTimer = null;
              }
              GlobalVoice.activeResponseId = null;
              GlobalVoice.isNewTurn = true;
              isNewTurnRef.current = true;
              GlobalVoice.nextPlayTime = 0;
              nextPlayTimeRef.current = 0;
              GlobalVoice.micInputEnabled = true;
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              voiceStateRef.current = 'INTERRUPTED';
              GlobalVoice.state = 'USER_INTERRUPTED';
              console.log('[AROHAN_VOICE] INTERRUPTION', `connectionId=${myConnectionId}`, `turnId=${GlobalVoice.activeTurnId}`, 'reason=server_vad');
            }

            // Handle Audio Playback
            if (message.serverContent?.modelTurn?.parts) {
              const currentTurnId = GlobalVoice.activeTurnId;
              const currentGen = arbiter.getGenerationId();
              const rawRespId = message.serverContent.modelTurn.id || `resp_turn_${currentTurnId}`;

              if (GlobalVoice.activeResponseId !== rawRespId) {
                if (GlobalVoice.seenResponseIds.has(rawRespId)) {
                  console.log('[AROHAN_VOICE] DUPLICATE_RESPONSE_DROPPED', `connectionId=${myConnectionId}`, `turnId=${currentTurnId}`, `responseId=${rawRespId}`);
                  return;
                }
                GlobalVoice.seenResponseIds.add(rawRespId);
                GlobalVoice.activeResponseId = rawRespId;
                GlobalVoice.chunkIndexInTurn = 0;
                GlobalVoice.state = 'AI_SPEAKING';

                console.log(
                  '[VOICE_RESPONSE] START',
                  `turn=${currentTurnId}`,
                  `response=${rawRespId}`,
                  `generation=${currentGen}`
                );
                console.log(
                  '[AROHAN_REALTIME] CURRENT_RESPONSE_ACCEPTED',
                  `turn=${currentTurnId}`,
                  `generation=${currentGen}`,
                  `responseId=${rawRespId}`
                );

                const curTurn = metricsRef.current.currentTurn;
                const nowResp = performance.now();
                const speechEndToResp = curTurn.t1_speechEnd ? (nowResp - curTurn.t1_speechEnd).toFixed(0) : '0';
                console.log(
                  '[VOICE_LATENCY] GEMINI_RESPONSE_STARTED',
                  `turnId=${currentTurnId}`,
                  `genId=${currentGen}`,
                  `responseId=${rawRespId}`,
                  `speechEndToResponseStart=${speechEndToResp}ms`
                );

                if (currentTurnId === 1) {
                  console.log('[AROHAN_VOICE] GREETING_RESPONSE_STARTED', `connectionId=${myConnectionId}`, `language=${GlobalVoice.activeLanguage}`);
                }
                console.log('[AROHAN_VOICE] MODEL_RESPONSE_START', `connectionId=${myConnectionId}`, `turnId=${currentTurnId}`, `language=${GlobalVoice.activeLanguage}`, `responseId=${rawRespId}`);
              }

              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                  const pcmData = part.inlineData.data;
                  if (pcmData) {
                    if (currentTurnId !== GlobalVoice.activeTurnId || arbiter.getGenerationId() !== currentGen) {
                      console.log(
                        '[VOICE_RESPONSE] AUDIO_DROPPED',
                        `turn=${currentTurnId}`,
                        `response=${rawRespId}`,
                        `reason=stale_turn_or_gen`,
                        `activeTurn=${GlobalVoice.activeTurnId}`
                      );
                      console.log(
                        '[AROHAN_REALTIME] STALE_RESPONSE_DROPPED',
                        `turn=${currentTurnId}`,
                        `activeTurn=${GlobalVoice.activeTurnId}`,
                        `gen=${currentGen}`,
                        `activeGen=${arbiter.getGenerationId()}`,
                        `responseId=${rawRespId}`
                      );
                      continue;
                    }

                    GlobalVoice.chunkIndexInTurn += 1;
                    const chunkIdx = GlobalVoice.chunkIndexInTurn;

                    console.log(
                      '[VOICE_RESPONSE] AUDIO_CHUNK',
                      `turn=${currentTurnId}`,
                      `response=${rawRespId}`,
                      `chunk=${chunkIdx}`
                    );
                    console.log('[AROHAN_VOICE] AUDIO_CHUNK', `connectionId=${myConnectionId}`, `turnId=${currentTurnId}`, `responseId=${rawRespId}`, `chunkIndex=${chunkIdx}`, `language=${GlobalVoice.activeLanguage}`);

                    if (silenceTimerRef.current) {
                      clearTimeout(silenceTimerRef.current);
                      silenceTimerRef.current = null;
                    }
                    if (userSpeechTimerRef.current) {
                      clearTimeout(userSpeechTimerRef.current);
                      userSpeechTimerRef.current = null;
                    }

                    const nowChunk = performance.now();
                    if (metricsRef.current.greetingSentTime && !metricsRef.current.greetingFirstAudioTime) {
                      metricsRef.current.greetingFirstAudioTime = nowChunk;
                      const greetingLatency = (metricsRef.current.greetingFirstAudioTime - metricsRef.current.greetingSentTime).toFixed(0);
                      console.log(`[VOICE_METRICS] GREETING_RESPONSE latency=${greetingLatency}ms`);
                    }

                    const cur = metricsRef.current.currentTurn;
                    if (cur.t0_speechStart && !cur.t2_firstAudioReceived) {
                      cur.t2_firstAudioReceived = nowChunk;
                      const dtFirstChunk = cur.t1_speechEnd ? (nowChunk - cur.t1_speechEnd).toFixed(0) : '0';
                      console.log(
                        '[VOICE_LATENCY] FIRST_AUDIO_CHUNK',
                        `turnId=${currentTurnId}`,
                        `responseId=${rawRespId}`,
                        `speechEndToFirstChunk=${dtFirstChunk}ms`
                      );
                    }
                    cur.chunkArrivalTimes.push(nowChunk);
                    cur.chunkCount += 1;

                    playPCMChunk(pcmData, myConnectionId, currentTurnId, rawRespId, chunkIdx);
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
              console.log('[VOICE_RESPONSE] TURN_COMPLETE', `turn=${GlobalVoice.activeTurnId}`, `response=${GlobalVoice.activeResponseId}`);
              console.log('[AROHAN_VOICE] TURN_COMPLETE', `connectionId=${myConnectionId}`, `turnId=${GlobalVoice.activeTurnId}`, `responseId=${GlobalVoice.activeResponseId}`);
              const cur = metricsRef.current.currentTurn;
              const totalTurnDur = cur.t0_speechStart ? (performance.now() - cur.t0_speechStart).toFixed(0) : '0';
              console.log(
                '[VOICE_LATENCY] RESPONSE_COMPLETE',
                `turnId=${GlobalVoice.activeTurnId}`,
                `totalChunks=${cur.chunkCount}`,
                `totalTurnDurationMs=${totalTurnDur}`
              );

              GlobalVoice.isNewTurn = true;
              isNewTurnRef.current = true;
              GlobalVoice.micInputEnabled = true;

              if (GlobalVoice.activeAudioNodes.length > 0) {
                console.log(
                  '[VOICE_RESPONSE] AUDIO_DRAIN_WAIT',
                  `turn=${GlobalVoice.activeTurnId}`,
                  `pendingNodes=${GlobalVoice.activeAudioNodes.length}`
                );
              } else {
                console.log('[VOICE_RESPONSE] AUDIO_DRAIN_COMPLETE', `turn=${GlobalVoice.activeTurnId}`);
                if (voiceStateRef.current === 'AI_SPEAKING') {
                  voiceStateRef.current = 'CONNECTED_IDLE';
                  GlobalVoice.state = 'LISTENING';
                  setIsSpeaking(false);
                  isSpeakingRef.current = false;
                  resetSilenceTimer();
                }
              }

              if (cur.chunkArrivalTimes.length > 1) {
                const intervals = [];
                for (let i = 1; i < cur.chunkArrivalTimes.length; i++) {
                  intervals.push(cur.chunkArrivalTimes[i] - cur.chunkArrivalTimes[i - 1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
                const stdDev = Math.sqrt(variance);
                console.log(`[VOICE_METRICS] Turn #${cur.id} Stream Stats: chunks=${cur.chunkCount}, avgInterval=${avgInterval.toFixed(1)}ms, jitterStdDev=${stdDev.toFixed(1)}ms`);
              }
            }
          },
          onclose: (event) => {
            if (
              GlobalVoice.activeConnectionId !== myConnectionId ||
              connectionIdRef.current !== myConnectionId ||
              !shouldReconnectRef.current
            ) {
              console.log('[AROHAN_VOICE] STALE_OR_INTENTIONAL_CLOSE_IGNORED', 'connId=' + myConnectionId, 'code=' + event?.code);
              return;
            }
            console.log('[AROHAN_VOICE] WS_CLOSED', event?.code, event?.reason);
            setIsConnected(false);
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            scheduleReconnect(myConnectionId, event?.code, event?.reason);
          },
          onerror: (err) => {
            if (
              GlobalVoice.activeConnectionId !== myConnectionId ||
              connectionIdRef.current !== myConnectionId ||
              !shouldReconnectRef.current
            ) {
              return;
            }
            console.error('[AROHAN_VOICE] ERROR', err);
          }
        }
      });

      // Stale check after promise settlement
      if (GlobalVoice.activeConnectionId !== myConnectionId) {
        console.log('[AROHAN_VOICE] STALE_CONNECTION_DISPOSED', 'id=' + myConnectionId, 'activeId=' + GlobalVoice.activeConnectionId);
        try { connectedSession.close(); } catch (e) {}
        stream.getTracks().forEach(t => t.stop());
        if (inputCtx.state !== 'closed') inputCtx.close().catch(() => {});
        if (playbackCtx.state !== 'closed') playbackCtx.close().catch(() => {});
        isConnectingRef.current = false;
        return;
      }

      GlobalVoice.activeSession = connectedSession;
      sessionRef.current = connectedSession;
      isConnectingRef.current = false;

      if (!isReconnect) {
        sendInitialGreetingIfReady(myConnectionId);
      }

    } catch (err) {
      if (GlobalVoice.activeConnectionId === myConnectionId) {
        console.error('[AROHAN_VOICE] ERROR', err);
        setError("Setup failed: " + err.message);
        isConnectingRef.current = false;
        teardownGlobalSession("setup_error");
      }
    }
  }, [disconnect, resetSilenceTimer, sendInitialGreetingIfReady]);

  return { isConnected, error, connect, disconnect, isSpeaking };
}
