/**
 * AAROHAN Global Audio Arbiter
 * Enforces single-generation speaker ownership across Web Audio and SpeechSynthesis.
 * Guarantees zero overlapping audio producers on AudioContext.destination at any instant.
 */

class AudioArbiter {
  constructor() {
    this.generationId = 1;
    this.activeOwner = 'NONE'; // 'NONE' | 'GEMINI_LIVE' | 'BROWSER_TTS'
    this.activeConnectionId = 0;
    this.activeTurnId = 0;
    this.activeResponseId = null;
    this.scheduledNodes = new Map(); // producerId -> { node, generationId, scheduledStart, scheduledEnd, status }
    this.lastScheduledEndTime = 0;
    this.nodeCounter = 0;
  }

  getGenerationId() {
    return this.generationId;
  }

  isLiveVoiceActive() {
    return this.activeOwner === 'GEMINI_LIVE' || Boolean(window.__AAROHAN_GLOBAL_VOICE__?.liveVoiceActive);
  }

  nextGeneration(reason = 'new_turn') {
    this.generationId += 1;
    const newGen = this.generationId;
    this.stopAllScheduledNodes(`generation_advanced_${reason}`);
    this.cancelAllTTS(`generation_advanced_${reason}`);
    this.lastScheduledEndTime = 0;
    console.log(`[AROHAN_ARBITER] GENERATION_ADVANCED genId=${newGen} reason=${reason}`);
    return newGen;
  }

  acquireLiveAudioGeneration({ connectionId, turnId, responseId = null, reason = 'turn_start' }) {
    this.activeOwner = 'GEMINI_LIVE';
    this.activeConnectionId = connectionId;
    this.activeTurnId = turnId;
    this.activeResponseId = responseId;
    const newGen = this.nextGeneration(reason);
    console.log(`[AROHAN_ARBITER] LIVE_AUDIO_ACQUIRED genId=${newGen} connId=${connectionId} turnId=${turnId} reason=${reason}`);
    return newGen;
  }

  releaseLiveAudio(reason = 'disconnect') {
    this.activeOwner = 'NONE';
    this.activeConnectionId = 0;
    this.activeTurnId = 0;
    this.activeResponseId = null;
    const newGen = this.nextGeneration(`live_released_${reason}`);
    console.log(`[AROHAN_ARBITER] LIVE_AUDIO_RELEASED genId=${newGen} reason=${reason}`);
  }

  invalidateAllAudio(reason = 'invalidation') {
    return this.nextGeneration(reason);
  }

  stopAllScheduledNodes(reason = 'invalidation') {
    let stoppedCount = 0;
    this.scheduledNodes.forEach((record, producerId) => {
      try {
        if (record.node && record.status !== 'ENDED' && record.status !== 'STOPPED') {
          record.node.stop();
          record.status = 'STOPPED';
          stoppedCount += 1;
          console.log(`[AROHAN_ARBITER] AUDIO_NODE_STOPPED producerId=${producerId} genId=${record.generationId} reason=${reason}`);
        }
      } catch (e) {}
    });
    this.scheduledNodes.clear();
    this.lastScheduledEndTime = 0;
    return stoppedCount;
  }

  cancelAllTTS(reason = 'arbiter_cancel') {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        console.log(`[AROHAN_ARBITER] TTS_CANCELLED reason=${reason}`);
      } catch (e) {}
    }
  }

  scheduleWebAudioNode({
    node,
    generationId,
    connectionId,
    turnId,
    responseId,
    duration,
    ctx,
    prebufferS = 0.10
  }) {
    if (this.activeOwner !== 'GEMINI_LIVE' || generationId !== this.generationId) {
      console.log(`[AROHAN_ARBITER] PRODUCER_REJECTED reason=STALE_GENERATION reqGen=${generationId} activeGen=${this.generationId} owner=${this.activeOwner}`);
      try { node.disconnect(); } catch (e) {}
      return null;
    }

    this.nodeCounter += 1;
    const producerId = `node_${this.nodeCounter}_g${generationId}_t${turnId}`;
    const now = ctx.currentTime;

    // Guaranteed Non-Overlapping Math:
    // scheduledStart must be >= now + prebuffer AND >= lastScheduledEndTime
    const minStart = now + prebufferS;
    const scheduledStart = Math.max(minStart, this.lastScheduledEndTime);
    const scheduledEnd = scheduledStart + duration;
    this.lastScheduledEndTime = scheduledEnd;

    const record = {
      producerId,
      node,
      generationId,
      connectionId,
      turnId,
      responseId,
      scheduledStart,
      duration,
      scheduledEnd,
      status: 'SCHEDULED'
    };
    this.scheduledNodes.set(producerId, record);

    node.onended = () => {
      record.status = 'ENDED';
      this.scheduledNodes.delete(producerId);
      console.log(`[AROHAN_ARBITER] AUDIO_NODE_ENDED producerId=${producerId} genId=${generationId} remainingQueued=${this.scheduledNodes.size}`);
    };

    console.log(
      `[AROHAN_ARBITER] AUDIO_NODE_SCHEDULED producerId=${producerId} genId=${generationId} connId=${connectionId} turnId=${turnId} start=${scheduledStart.toFixed(3)} dur=${duration.toFixed(3)} end=${scheduledEnd.toFixed(3)} now=${now.toFixed(3)}`
    );

    try {
      node.start(scheduledStart);
      return { producerId, scheduledStart, scheduledEnd };
    } catch (err) {
      console.error(`[AROHAN_ARBITER] AUDIO_NODE_START_FAILED producerId=${producerId}`, err);
      this.scheduledNodes.delete(producerId);
      return null;
    }
  }

  requestSpeech(utterance, { source = 'unknown', id = null } = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !utterance) {
      return false;
    }

    if (this.isLiveVoiceActive()) {
      console.log(`[AROHAN_ARBITER] TTS_BLOCKED reason=LIVE_AUDIO_ACTIVE source=${source} id=${id || 'auto'}`);
      this.cancelAllTTS('live_voice_active_gate');
      return false;
    }

    const ttsGen = this.nextGeneration('tts_request');
    console.log(`[AROHAN_ARBITER] TTS_ALLOWED genId=${ttsGen} source=${source} id=${id || 'auto'} lang=${utterance.lang || 'default'}`);
    try {
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.error('[AROHAN_ARBITER] Error in speechSynthesis.speak:', err);
      return false;
    }
  }
}

export const arbiter = new AudioArbiter();
if (typeof window !== 'undefined') {
  window.__AAROHAN_AUDIO_ARBITER__ = arbiter;
}

export const isLiveVoiceActive = () => arbiter.isLiveVoiceActive();
export const cancelAllSpeech = (reason) => arbiter.cancelAllTTS(reason);
export const requestSpeech = (utterance, meta) => arbiter.requestSpeech(utterance, meta);
