const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const EmotionAnalysis = require('../models/EmotionAnalysis');
const Case = require('../models/Case');
const Counselor = require('../models/Counselor');
const Alert = require('../models/Alert');
const { initiateEmergencyCall } = require('./voiceService');
const aiService = require('./aiService');
const riskEventService = require('./riskEventService');
const automaticCallService = require('./automaticCallService');

/**
 * Language code resolver — maps frontend dropdown labels to ISO codes
 */
const LANG_MAP = {
  'English': 'en', 'Telugu (తెలుగు)': 'te', 'Hindi (हिंदी)': 'hi',
  'Tamil (தமிழ்)': 'ta', 'Kannada (కన్నడ)': 'kn', 'Malayalam (മലയാളം)': 'ml',
  'Spanish (Español)': 'es', 'French (Français)': 'fr',
  'Marathi (मराठी)': 'mr', 'Bengali (বাংলা)': 'bn', 'Gujarati (ગુજરાતી)': 'gu',
};

const resolveLangCode = (lang) => LANG_MAP[lang] || lang || 'en';

/**
 * Map Gemini emotion labels to EmotionAnalysis schema keys
 */
const EMOTION_LABEL_MAP = {
  'fear': 'Fearful', 'sadness': 'Sad', 'anger': 'Angry',
  'joy': 'Calm', 'disgust': 'Angry', 'surprise': 'Anxious',
  'neutral': 'Neutral',
  // Direct mappings (from fallback)
  'Fearful': 'Fearful', 'Sad': 'Sad', 'Angry': 'Angry',
  'Calm': 'Calm', 'Anxious': 'Anxious', 'Hopeful': 'Hopeful', 'Neutral': 'Neutral'
};

const mapEmotion = (label) => EMOTION_LABEL_MAP[label] || 'Neutral';

/**
 * Compute distress band from score
 */
const getDistressBand = (score) => {
  if (score >= 75) return 'Severe';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Moderate';
  return 'Low';
};

/**
 * Mirror of riskEventService.normalizeRiskLevel score bands — lets the API
 * return the risk level instantly instead of awaiting the background
 * risk-event write chain (Case/CallLog/Notification round-trips).
 */
const deriveRiskLevel = (distressScore) => {
  const score = Number(distressScore || 0);
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
};

/**
 * Process a victim's chat message — full pipeline:
 * 1. Keyword crisis check (instant)
 * 2. Gemini unified analysis + response
 * 3. Dual crisis override (keyword OR LLM crisis_flag)
 * 4. Save real data to ChatMessage + EmotionAnalysis
 * 5. Return structured result
 */
const triggerCrisisEscalation = async (victimId, analysis) => {
  try {
    const victimCase = await Case.findOne({ victimId, status: { $in: ['open', 'in-progress', 'assigned', 'resolved'] } }).populate('assignedCounselorId');
    if (!victimCase || !victimCase.assignedCounselorId) {
      return { escalated: false, reason: 'No assigned counselor found' };
    }

    const counselorPhone = victimCase.assignedCounselorId.phone;
    if (!counselorPhone) {
      return { escalated: false, reason: 'Counselor phone missing' };
    }

    await Alert.create({
      caseId: victimCase._id,
      victimId,
      severity: 'CRITICAL',
      alertType: 'AI_CRISIS_DETECTED',
      description: `AI detected a high-risk mental health crisis in victim chat: ${analysis?.crisis_flag ? 'suicidal ideation or severe danger detected' : 'distress escalation observed'}.`
    });

    const callResult = await initiateEmergencyCall(counselorPhone);
    if (!callResult.success) {
      return { escalated: false, reason: callResult.code || 'voice_failed' };
    }

    return { escalated: true, callSid: callResult.callSid, status: callResult.status };
  } catch (error) {
    console.error('[chatbotService] Crisis escalation failed:', error.message);
    return { escalated: false, reason: error.message };
  }
};

const processVictimMessage = async (sessionId, victimId, content, language = 'English') => {
  // 1. Verify session exists and belongs to the victim
  const session = await ChatSession.findOne({ _id: sessionId, victimId, status: 'active' });
  if (!session) {
    const error = new Error('Session not found or not active');
    error.status = 404;
    throw error;
  }

  const langCode = resolveLangCode(language);

  // 2. Run keyword crisis check FIRST (instant, no API needed)
  const keywordCrisis = aiService.getKeywordCrisisFlag(content);

  // 3. History fetch runs in parallel with nothing else needed pre-LLM; the
  // session lookup already gated access above.
  const contextLimit = parseInt(process.env.CHAT_CONTEXT_MESSAGES) || 15;
  const previousMessages = await ChatMessage.find({ sessionId: session._id })
    .sort({ createdAt: -1 })
    .limit(contextLimit);
  previousMessages.reverse();

  const conversationHistory = previousMessages.map(msg => ({
    role: msg.senderType === 'victim' ? 'user' : 'assistant',
    content: msg.content
  }));

  // 4. Call Gemini unified analysis (or smart fallback)
  let analysis;
  try {
    analysis = await aiService.analyzeAndRespond(content, conversationHistory, language);
  } catch (error) {
    console.error('[chatbotService] AI analysis failed:', error.message);
    analysis = aiService.getSmartFallback(content, language);
  }

  // 5. DUAL CRISIS CHECK — keyword OR LLM crisis_flag
  const isCrisis = keywordCrisis || analysis.crisis_flag;

  if (isCrisis) {
    // Override LLM reply with FIXED safety message — never let LLM compose crisis words
    analysis.reply = aiService.getSafetyMessage(analysis.language_detected || langCode);
    analysis.crisis_flag = true;
    analysis.distress_score = Math.max(analysis.distress_score, 90);

    // Fire-and-forget: the victim must get their safety message immediately;
    // a slow Twilio attempt must never add seconds to the chat round-trip.
    triggerCrisisEscalation(victimId, analysis)
      .then((escalation) => {
        if (escalation.escalated) {
          console.log('[chatbotService] Crisis escalated to assigned counselor:', escalation.callSid || 'no-call-sid');
        }
      })
      .catch((err) => console.error('[chatbotService] Background escalation failed:', err.message));
  }

  const distressBand = getDistressBand(analysis.distress_score);
  const primaryEmotionRaw = analysis.emotions?.[0]?.label || 'neutral';
  const primaryEmotion = mapEmotion(primaryEmotionRaw);

  // 6. Save victim message with real metadata
  const userMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType: 'victim',
    content,
    isFlagged: isCrisis,
    metadata: {
      emotion: primaryEmotion,
      distressScore: analysis.distress_score,
      distressBand,
      language: langCode,
      sentiment: analysis.sentiment,
      emotions: analysis.emotions,
      crisis_flag: isCrisis,
      language_detected: analysis.language_detected,
      source: analysis.source
    }
  });

  // Escalation is backend-owned and gated by risk. Risk-event creation and any
  // automatic counselor call run fully in the background — they involve ~8
  // serial DB round-trips (and possibly Twilio) that must never delay the
  // victim's reply. The API derives risk_level locally instead of awaiting.
  riskEventService.createRiskEvent({
    victimId,
    sourceMessageId: userMessage._id,
    analysis: {
      ...analysis,
      distress_score: analysis.distress_score,
      crisis_flag: isCrisis,
    },
  })
    .then(async (riskEventResult) => {
      if (riskEventResult.eligible && riskEventResult.event) {
        try {
          await automaticCallService.initiateAutomaticCall({
            victimId,
            riskEvent: riskEventResult.event,
          });
        } catch (err) {
          console.error('[chatbotService] Automatic call failed:', err.message);
        }
      }
    })
    .catch((err) => console.error('[chatbotService] Risk event creation failed:', err.message));

  // 7-9. EmotionAnalysis update, session update, and AI-reply save run in
  // parallel — one round-trip of latency instead of three.
  const emotionUpdatePromise = (async () => {
    try {
      let emotionDoc = await EmotionAnalysis.findOne({ victimId });
      if (!emotionDoc) {
        emotionDoc = new EmotionAnalysis({
          victimId,
          sessionId: session._id,
          distressScore: analysis.distress_score,
          distressBand,
          primaryEmotion,
          emotionsBreakdown: {
            Anxious: 0, Sad: 0, Fearful: 0, Angry: 0,
            Calm: 0, Hopeful: 0, Neutral: 0
          },
          recentLog: []
        });
      }

      // Rolling average distress score (weighted toward recent)
      emotionDoc.distressScore = Math.round(
        (emotionDoc.distressScore * 0.4) + (analysis.distress_score * 0.6)
      );
      emotionDoc.distressBand = getDistressBand(emotionDoc.distressScore);
      emotionDoc.primaryEmotion = primaryEmotion;
      emotionDoc.sessionId = session._id;

      // Increment emotion count
      if (emotionDoc.emotionsBreakdown[primaryEmotion] !== undefined) {
        emotionDoc.emotionsBreakdown[primaryEmotion] += 1;
      } else {
        emotionDoc.emotionsBreakdown[primaryEmotion] = 1;
      }

      // Add to recent log
      emotionDoc.recentLog.unshift({
        message: content.substring(0, 100),
        emotion: primaryEmotion,
        distressScore: analysis.distress_score,
        timestamp: new Date()
      });
      if (emotionDoc.recentLog.length > 20) {
        emotionDoc.recentLog = emotionDoc.recentLog.slice(0, 20);
      }

      await emotionDoc.save();
    } catch (err) {
      console.error('[chatbotService] EmotionAnalysis update failed:', err.message);
    }
  })();

  session.lastMessageAt = Date.now();
  if (session.title === 'New Conversation') {
    session.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }

  const aiMessagePromise = ChatMessage.create({
    sessionId: session._id,
    senderType: isCrisis ? 'system' : 'ai',
    content: analysis.reply,
    isFlagged: isCrisis,
    metadata: {
      emotionResponseFor: primaryEmotion,
      language: langCode,
      source: analysis.source
    }
  });

  // The reply is persisted alongside telemetry in parallel; once this resolves
  // the victim gets their answer. Nothing here waits on Twilio or risk writes.
  const [aiMessage] = await Promise.all([
    aiMessagePromise,
    session.save(),
    emotionUpdatePromise,
  ]);

  return {
    userMessage,
    aiMessage,
    analysis: {
      sentiment: analysis.sentiment,
      emotions: analysis.emotions,
      distress_score: analysis.distress_score,
      distress_band: distressBand,
      // Derived locally from the distress score (same bands as
      // riskEventService) so the response never waits on background writes.
      risk_level: deriveRiskLevel(analysis.distress_score),
      risk_score: analysis.risk_score ?? analysis.riskScore ?? analysis.distress_score,
      crisis_flag: isCrisis,
      language_detected: analysis.language_detected || langCode,
      primary_emotion: primaryEmotionRaw,
      primary_emotion_mapped: primaryEmotion,
      source: analysis.source,
      // The background chain decides escalation/call outcomes after responding.
      escalationEligible: isCrisis || analysis.distress_score >= 50,
      automaticCall: null,
    }
  };
};

const processVictimMessageStream = async (sessionId, victimId, content, language = 'English', onChunk = () => {}) => {
  const session = await ChatSession.findOne({ _id: sessionId, victimId, status: 'active' });
  if (!session) {
    const error = new Error('Session not found or not active');
    error.status = 404;
    throw error;
  }

  const langCode = resolveLangCode(language);
  const keywordCrisis = aiService.getKeywordCrisisFlag(content);

  const contextLimit = parseInt(process.env.CHAT_CONTEXT_MESSAGES) || 15;
  const previousMessages = await ChatMessage.find({ sessionId: session._id })
    .sort({ createdAt: -1 })
    .limit(contextLimit);
  previousMessages.reverse();

  const conversationHistory = previousMessages.map(msg => ({
    role: msg.senderType === 'victim' ? 'user' : 'assistant',
    content: msg.content
  }));

  let analysis;
  if (keywordCrisis) {
    const safetyReply = aiService.getSafetyMessage(langCode);
    onChunk(safetyReply);
    analysis = {
      language_detected: langCode,
      sentiment: { label: 'negative', score: 0.9 },
      emotions: [{ label: 'fear', score: 0.9 }],
      distress_score: 90,
      crisis_flag: true,
      reply: safetyReply,
      source: 'keyword_crisis'
    };
  } else {
    try {
      const streamResult = await aiService.fastConversationalStream(content, conversationHistory, language, onChunk);
      const baseAnalysis = aiService.getSmartFallback(content, language);
      analysis = {
        ...baseAnalysis,
        reply: streamResult.reply || baseAnalysis.reply,
        source: streamResult.source || 'api_fast_stream'
      };
    } catch (error) {
      console.error('[chatbotService-Stream] Fast stream failed:', error.message);
      analysis = aiService.getSmartFallback(content, language);
      onChunk(analysis.reply);
    }
  }

  const isCrisis = keywordCrisis || analysis.crisis_flag;
  if (isCrisis && !keywordCrisis) {
    analysis.reply = aiService.getSafetyMessage(analysis.language_detected || langCode);
    analysis.crisis_flag = true;
    analysis.distress_score = Math.max(analysis.distress_score, 90);
    onChunk(analysis.reply);

    triggerCrisisEscalation(victimId, analysis)
      .catch((err) => console.error('[chatbotService] Background escalation failed:', err.message));
  } else if (keywordCrisis) {
    triggerCrisisEscalation(victimId, analysis)
      .catch((err) => console.error('[chatbotService] Background escalation failed:', err.message));
  }

  const distressBand = getDistressBand(analysis.distress_score);
  const primaryEmotionRaw = analysis.emotions?.[0]?.label || 'neutral';
  const primaryEmotion = mapEmotion(primaryEmotionRaw);

  const userMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType: 'victim',
    content,
    isFlagged: isCrisis,
    metadata: {
      emotion: primaryEmotion,
      distressScore: analysis.distress_score,
      distressBand,
      language: langCode,
      sentiment: analysis.sentiment,
      emotions: analysis.emotions,
      crisis_flag: isCrisis,
      language_detected: analysis.language_detected,
      source: analysis.source
    }
  });

  riskEventService.createRiskEvent({
    victimId,
    sourceMessageId: userMessage._id,
    analysis: {
      ...analysis,
      distress_score: analysis.distress_score,
      crisis_flag: isCrisis,
    },
  }).then(async (riskEventResult) => {
    if (riskEventResult.eligible && riskEventResult.event) {
      try {
        await automaticCallService.initiateAutomaticCall({
          victimId,
          riskEvent: riskEventResult.event,
        });
      } catch (err) {
        console.error('[chatbotService] Automatic call failed:', err.message);
      }
    }
  }).catch((err) => console.error('[chatbotService] Risk event creation failed:', err.message));

  const emotionUpdatePromise = (async () => {
    try {
      let emotionDoc = await EmotionAnalysis.findOne({ victimId });
      if (!emotionDoc) {
        emotionDoc = new EmotionAnalysis({
          victimId,
          sessionId: session._id,
          distressScore: analysis.distress_score,
          distressBand,
          primaryEmotion,
          emotionsBreakdown: {
            Anxious: 0, Sad: 0, Fearful: 0, Angry: 0,
            Calm: 0, Hopeful: 0, Neutral: 0
          },
          recentLog: []
        });
      }

      emotionDoc.distressScore = Math.round(
        (emotionDoc.distressScore * 0.4) + (analysis.distress_score * 0.6)
      );
      emotionDoc.distressBand = getDistressBand(emotionDoc.distressScore);
      emotionDoc.primaryEmotion = primaryEmotion;
      emotionDoc.sessionId = session._id;

      if (emotionDoc.emotionsBreakdown[primaryEmotion] !== undefined) {
        emotionDoc.emotionsBreakdown[primaryEmotion] += 1;
      } else {
        emotionDoc.emotionsBreakdown[primaryEmotion] = 1;
      }

      emotionDoc.recentLog.unshift({
        message: content.substring(0, 100),
        emotion: primaryEmotion,
        distressScore: analysis.distress_score,
        timestamp: new Date()
      });
      if (emotionDoc.recentLog.length > 20) {
        emotionDoc.recentLog = emotionDoc.recentLog.slice(0, 20);
      }

      await emotionDoc.save();
    } catch (err) {
      console.error('[chatbotService] EmotionAnalysis update failed:', err.message);
    }
  })();

  session.lastMessageAt = Date.now();
  if (session.title === 'New Conversation') {
    session.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }

  const aiMessagePromise = ChatMessage.create({
    sessionId: session._id,
    senderType: isCrisis ? 'system' : 'ai',
    content: analysis.reply,
    isFlagged: isCrisis,
    metadata: {
      emotionResponseFor: primaryEmotion,
      language: langCode,
      source: analysis.source
    }
  });

  const [aiMessage] = await Promise.all([
    aiMessagePromise,
    session.save(),
    emotionUpdatePromise,
  ]);

  return {
    userMessage,
    aiMessage,
    analysis: {
      sentiment: analysis.sentiment,
      emotions: analysis.emotions,
      distress_score: analysis.distress_score,
      distress_band: distressBand,
      risk_level: deriveRiskLevel(analysis.distress_score),
      risk_score: analysis.risk_score ?? analysis.riskScore ?? analysis.distress_score,
      crisis_flag: isCrisis,
      language_detected: analysis.language_detected || langCode,
      primary_emotion: primaryEmotionRaw,
      primary_emotion_mapped: primaryEmotion,
      source: analysis.source,
      escalationEligible: isCrisis || analysis.distress_score >= 50,
      automaticCall: null,
    }
  };
};

module.exports = {
  processVictimMessage,
  processVictimMessageStream,
  triggerCrisisEscalation
};

