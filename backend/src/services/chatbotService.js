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

  // 3. Get conversation history for context
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

    const escalation = await triggerCrisisEscalation(victimId, analysis);
    if (escalation.escalated) {
      console.log('[chatbotService] Crisis escalated to assigned counselor:', escalation.callSid || 'no-call-sid');
    }
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

  // Escalation is backend-owned and gated by both normalized risk and danger signals.
  const riskEventResult = await riskEventService.createRiskEvent({
    victimId,
    sourceMessageId: userMessage._id,
    analysis: {
      ...analysis,
      distress_score: analysis.distress_score,
      crisis_flag: isCrisis,
    },
  });

  let automaticCall = null;
  if (riskEventResult.eligible && riskEventResult.event) {
    automaticCall = await automaticCallService.initiateAutomaticCall({
      victimId,
      riskEvent: riskEventResult.event,
    });
  }

  // 7. Update EmotionAnalysis record for counselor reports
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

  // 8. Update session
  session.lastMessageAt = Date.now();
  if (session.title === 'New Conversation') {
    session.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }
  await session.save();

  // 9. Save AI response
  const aiMessage = await ChatMessage.create({
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

  // 10. Return full structured result
  return {
    userMessage,
    aiMessage,
    analysis: {
      sentiment: analysis.sentiment,
      emotions: analysis.emotions,
      distress_score: analysis.distress_score,
      distress_band: distressBand,
      risk_level: riskEventResult.riskLevel,
      risk_score: analysis.risk_score ?? analysis.riskScore ?? analysis.distress_score,
      crisis_flag: isCrisis,
      language_detected: analysis.language_detected || langCode,
      primary_emotion: primaryEmotionRaw,
      primary_emotion_mapped: primaryEmotion,
      source: analysis.source,
      escalationEligible: riskEventResult.eligible,
      automaticCall: automaticCall ? {
        initiated: automaticCall.initiated,
        duplicate: automaticCall.duplicate || false,
        dryRun: automaticCall.dryRun || false,
        reason: automaticCall.reason || null,
        status: automaticCall.callLog?.callStatus || null,
      } : null,
    }
  };
};

module.exports = {
  processVictimMessage
};
