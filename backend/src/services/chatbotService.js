const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const EmotionAnalysis = require('../models/EmotionAnalysis');
const aiService = require('./aiService');

/**
 * Basic Safety Layer Check
 * Checks for immediate safety concerns based on simple keywords.
 * This is NOT a clinical diagnosis tool.
 */
const performSafetyCheck = (message) => {
  const safetyKeywords = [
    'suicide', 'kill myself', 'want to die', 'end my life',
    'hurt myself', 'harm myself', 'in danger', 'he is going to kill me',
    'she is going to kill me', 'they are going to kill me'
  ];
  
  const lowerMsg = message.toLowerCase();
  return safetyKeywords.some(keyword => lowerMsg.includes(keyword));
};

const getSafetyResponse = () => {
  return "I am so sorry you are going through this. I am a chatbot and cannot provide immediate emergency help. Please reach out to your local emergency services (e.g., 112) or contact your assigned counselor immediately if you feel you are in danger or considering self-harm.";
};

const processVictimMessage = async (sessionId, victimId, content, language = 'English') => {
  // 1. Verify session exists and belongs to the victim (prevent IDOR)
  const session = await ChatSession.findOne({ _id: sessionId, victimId, status: 'active' });
  if (!session) {
    const error = new Error('Session not found or not active');
    error.status = 404;
    throw error;
  }

  // 2. Perform lightweight safety check & emotion analysis
  const isFlagged = performSafetyCheck(content);
  const emotionResult = aiService.analyzeEmotionAndDistress(content);

  // 3. Save victim message with metadata
  const userMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType: 'victim',
    content,
    isFlagged,
    metadata: {
      emotion: emotionResult.primaryEmotion,
      distressScore: emotionResult.distressScore,
      distressBand: emotionResult.distressBand,
      language
    }
  });

  // Update or create EmotionAnalysis record for counselor reports
  try {
    let analysis = await EmotionAnalysis.findOne({ victimId });
    if (!analysis) {
      analysis = new EmotionAnalysis({
        victimId,
        sessionId: session._id,
        distressScore: emotionResult.distressScore,
        distressBand: emotionResult.distressBand,
        primaryEmotion: emotionResult.primaryEmotion,
        emotionsBreakdown: {
          Anxious: 0,
          Sad: 0,
          Fearful: 0,
          Angry: 0,
          Calm: 0,
          Hopeful: 0,
          Neutral: 0
        },
        recentLog: []
      });
    }

    // Update distress score & emotion breakdown
    analysis.distressScore = Math.round((analysis.distressScore + emotionResult.distressScore) / 2);
    let band = 'Low';
    if (analysis.distressScore >= 75) band = 'Severe';
    else if (analysis.distressScore >= 50) band = 'High';
    else if (analysis.distressScore >= 25) band = 'Moderate';

    analysis.distressBand = band;
    analysis.primaryEmotion = emotionResult.primaryEmotion;
    analysis.sessionId = session._id;

    if (analysis.emotionsBreakdown[emotionResult.primaryEmotion] !== undefined) {
      analysis.emotionsBreakdown[emotionResult.primaryEmotion] += 1;
    } else {
      analysis.emotionsBreakdown[emotionResult.primaryEmotion] = 1;
    }

    analysis.recentLog.unshift({
      message: content.substring(0, 100),
      emotion: emotionResult.primaryEmotion,
      distressScore: emotionResult.distressScore,
      timestamp: new Date()
    });

    if (analysis.recentLog.length > 20) {
      analysis.recentLog = analysis.recentLog.slice(0, 20);
    }

    await analysis.save();
  } catch (err) {
    console.error('Failed to update EmotionAnalysis record:', err.message);
  }

  // 4. Update session lastMessageAt
  session.lastMessageAt = Date.now();
  if (session.title === 'New Conversation') {
    session.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }
  await session.save();

  // 5. Determine AI Response
  let aiContent = '';
  let aiIsFlagged = false;
  let senderType = 'ai';

  if (isFlagged) {
    aiContent = getSafetyResponse();
    aiIsFlagged = true;
    senderType = 'system';
  } else {
    try {
      const contextLimit = parseInt(process.env.CHAT_CONTEXT_MESSAGES) || 15;
      
      const previousMessages = await ChatMessage.find({ sessionId: session._id })
        .sort({ createdAt: -1 })
        .limit(contextLimit);
        
      previousMessages.reverse();

      const messagesArray = previousMessages.map(msg => ({
        role: msg.senderType === 'victim' ? 'user' : 'assistant',
        content: msg.content
      }));

      aiContent = await aiService.getChatbotResponse(messagesArray, {
        emotion: emotionResult.primaryEmotion,
        language
      });
      
    } catch (error) {
      console.error('[ChatbotService AI Error]:', error.message);
      aiContent = aiService.getFallbackResponse(content, emotionResult.primaryEmotion, language);
    }
  }

  // 6. Save AI/System Response
  const aiMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType,
    content: aiContent,
    isFlagged: aiIsFlagged,
    metadata: {
      emotionResponseFor: emotionResult.primaryEmotion,
      language
    }
  });

  return { userMessage, aiMessage, emotionResult };
};

module.exports = {
  processVictimMessage
};

