const asyncHandler = require('express-async-handler');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const EmotionAnalysis = require('../models/EmotionAnalysis');
const chatbotService = require('../services/chatbotService');

// @desc    Create a new chat session
// @route   POST /api/v1/chatbot/sessions
// @access  Private (Victim only)
const createSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.create({
    victimId: req.user._id,
    title: 'New Conversation'
  });

  res.status(201).json({
    success: true,
    data: session
  });
});

// @desc    Get all chat sessions for the victim
// @route   GET /api/v1/chatbot/sessions
// @access  Private (Victim only)
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ victimId: req.user._id, status: 'active' })
    .sort({ lastMessageAt: -1 })
    .select('-__v');

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions
  });
});

// @desc    Get messages for a specific session
// @route   GET /api/v1/chatbot/sessions/:id/messages
// @access  Private (Victim only)
const getSessionMessages = asyncHandler(async (req, res) => {
  // CRITICAL: Verify session ownership (IDOR prevention)
  const session = await ChatSession.findOne({ _id: req.params.id, victimId: req.user._id });
  
  if (!session) {
    res.status(404);
    throw new Error('Chat session not found');
  }

  const messages = await ChatMessage.find({ sessionId: session._id })
    .sort({ createdAt: 1 })
    .select('-__v');

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Send a message and get response
// @route   POST /api/v1/chatbot/sessions/:id/messages
// @access  Private (Victim only)
const sendMessage = asyncHandler(async (req, res) => {
  const { content, language } = req.body;
  const sessionId = req.params.id;
  const victimId = req.user._id;

  try {
    const { userMessage, aiMessage, analysis } = await chatbotService.processVictimMessage(sessionId, victimId, content, language || 'English');
    
    res.status(200).json({
      success: true,
      data: aiMessage,
      userMessage,
      analysis
    });
  } catch (error) {
    res.status(error.status || 500);
    throw new Error(error.message || 'Server Error');
  }
});

// @desc    Archive a chat session
// @route   DELETE /api/v1/chatbot/sessions/:id
// @access  Private (Victim only)
const archiveSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({ _id: req.params.id, victimId: req.user._id });
  
  if (!session) {
    res.status(404);
    throw new Error('Chat session not found');
  }

  session.status = 'archived';
  await session.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

const DailyUpdate = require('../models/DailyUpdate');

// @desc    Submit a daily check-in
// @route   POST /api/v1/chatbot/checkin
// @access  Private (Victim only)
const submitCheckIn = asyncHandler(async (req, res) => {
  const { feeling } = req.body;

  const validFeelings = ['Very good', 'Good', 'Okay', 'Bad', 'Very bad'];
  if (!validFeelings.includes(feeling)) {
    res.status(400);
    throw new Error('Invalid feeling selection');
  }

  const checkin = await DailyUpdate.create({
    victimId: req.user._id,
    feeling
  });

  res.status(201).json({
    success: true,
    data: checkin
  });
});

// @desc    Trigger crisis escalation directly from voice call
// @route   POST /api/v1/chatbot/voice-escalation
// @access  Private (Victim only)
const triggerVoiceEscalation = asyncHandler(async (req, res) => {
  const victimId = req.user._id;
  const { distress_score, crisis_flag, emotions } = req.body;

  const analysis = {
    distress_score: distress_score || 100,
    crisis_flag: crisis_flag !== undefined ? crisis_flag : true,
    emotions: emotions || 'fear, sadness'
  };

  // Find active chat session or create one for logging
  let session = await ChatSession.findOne({ victimId, status: 'active' }).sort({ lastMessageAt: -1 });
  if (!session) {
    session = await ChatSession.create({
      victimId,
      title: 'Voice Call Session'
    });
  }

  // Create a message record for the counselor dashboard
  const userMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType: 'victim',
    content: analysis.crisis_flag || analysis.distress_score > 80 
      ? '[Live Voice Call] AI detected self-harm or severe crisis.'
      : `[Live Voice Call] Emotion logged: ${analysis.emotions}`,
    isFlagged: analysis.crisis_flag || analysis.distress_score > 80,
    metadata: {
      emotion: 'Fearful',
      distressScore: analysis.distress_score,
      distressBand: analysis.distress_score >= 75 ? 'Severe' : (analysis.distress_score >= 50 ? 'High' : 'Moderate'),
      language: 'en',
      crisis_flag: analysis.crisis_flag,
      source: 'voice'
    }
  });

  // Update EmotionAnalysis so the dashboard sees the latest condition
  try {
    let emotionDoc = await EmotionAnalysis.findOne({ victimId });
    if (!emotionDoc) {
      emotionDoc = new EmotionAnalysis({
        victimId,
        sessionId: session._id,
        distressScore: analysis.distress_score,
        distressBand: analysis.distress_score >= 75 ? 'Severe' : 'High',
        primaryEmotion: 'Fearful',
        emotionsBreakdown: { Anxious: 0, Sad: 0, Fearful: 1, Angry: 0, Calm: 0, Hopeful: 0, Neutral: 0 },
        recentLog: []
      });
    } else {
      emotionDoc.distressScore = Math.round((emotionDoc.distressScore * 0.4) + (analysis.distress_score * 0.6));
      emotionDoc.distressBand = emotionDoc.distressScore >= 75 ? 'Severe' : (emotionDoc.distressScore >= 50 ? 'High' : 'Moderate');
      emotionDoc.primaryEmotion = 'Fearful';
      if (emotionDoc.emotionsBreakdown['Fearful'] !== undefined) {
        emotionDoc.emotionsBreakdown['Fearful'] += 1;
      }
    }
    
    emotionDoc.recentLog.unshift({
      message: analysis.crisis_flag || analysis.distress_score > 80
        ? '[Live Voice Call] Immediate crisis reported by AI voice assistant.'
        : `[Live Voice Call] Emotion logged: ${analysis.emotions}`,
      emotion: 'Fearful',
      distressScore: analysis.distress_score,
      timestamp: new Date()
    });
    if (emotionDoc.recentLog.length > 20) {
      emotionDoc.recentLog = emotionDoc.recentLog.slice(0, 20);
    }
    
    emotionDoc.isVoiceCallActive = true;
    await emotionDoc.save();
  } catch (err) {
    console.error('Failed to update EmotionAnalysis for Voice Call:', err);
  }

  let escalation = null;
  if (analysis.crisis_flag || analysis.distress_score > 80) {
    escalation = await chatbotService.triggerCrisisEscalation(victimId, analysis);
  }

  res.status(200).json({
    success: true,
    data: escalation || { escalated: false, reason: 'Log only, no crisis detected.' }
  });
});

// @desc    End voice call and save final summary
// @route   POST /api/v1/chatbot/voice-end
// @access  Private (Victim only)
const endVoiceCall = asyncHandler(async (req, res) => {
  const victimId = req.user._id;
  const { duration, summary } = req.body;

  let session = await ChatSession.findOne({ victimId, status: 'active' }).sort({ lastMessageAt: -1 });
  if (!session) {
    session = await ChatSession.create({
      victimId,
      title: 'Voice Call Session'
    });
  }

  // Create a message record for the final summary
  const sysMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType: 'system',
    content: `[Voice Call Ended] Duration: ${duration || 'Unknown'}. Summary: ${summary || 'No summary available.'}`,
    isFlagged: false,
    metadata: {
      source: 'voice_summary'
    }
  });

  // Update EmotionAnalysis so the dashboard sees the call ended
  try {
    let emotionDoc = await EmotionAnalysis.findOne({ victimId });
    if (emotionDoc) {
      emotionDoc.isVoiceCallActive = false;
      await emotionDoc.save();
    }
  } catch (err) {
    console.error('Failed to update EmotionAnalysis for Voice End:', err);
  }

  res.status(200).json({
    success: true,
    data: sysMessage
  });
});

// @desc    Start voice call and set active status
// @route   POST /api/v1/chatbot/voice-start
// @access  Private (Victim only)
const startVoiceCall = asyncHandler(async (req, res) => {
  const victimId = req.user._id;
  try {
    let emotionDoc = await EmotionAnalysis.findOne({ victimId });
    if (!emotionDoc) {
      emotionDoc = new EmotionAnalysis({
        victimId,
        distressScore: 0,
        distressBand: 'Low',
        primaryEmotion: 'Calm',
        emotionsBreakdown: { Anxious: 0, Sad: 0, Fearful: 0, Angry: 0, Calm: 0, Hopeful: 0, Neutral: 0 },
        recentLog: []
      });
    }
    emotionDoc.isVoiceCallActive = true;
    await emotionDoc.save();
  } catch (err) {
    console.error('Failed to update EmotionAnalysis for Voice Start:', err);
  }

  res.status(200).json({ success: true });
});

// @desc    Log a conversation turn from voice call
// @route   POST /api/v1/chatbot/voice-log
// @access  Private (Victim only)
const logVoiceTurn = asyncHandler(async (req, res) => {
  const victimId = req.user._id;
  const { user_said, ai_response, distress_score, emotion } = req.body;

  let session = await ChatSession.findOne({ victimId, status: 'active' }).sort({ lastMessageAt: -1 });
  if (!session) {
    session = await ChatSession.create({
      victimId,
      title: 'Voice Call Session'
    });
  }

  // Create user message
  await ChatMessage.create({
    sessionId: session._id,
    senderType: 'victim',
    content: `[Voice Transcript] ${user_said}`,
    metadata: {
      emotion: emotion || 'Neutral',
      distressScore: distress_score || 0,
      source: 'voice'
    }
  });

  // Create AI message
  await ChatMessage.create({
    sessionId: session._id,
    senderType: 'ai',
    content: ai_response,
    metadata: {
      source: 'voice'
    }
  });

  try {
    let emotionDoc = await EmotionAnalysis.findOne({ victimId });
    if (emotionDoc) {
      if (distress_score !== undefined) {
        emotionDoc.distressScore = Math.round((emotionDoc.distressScore * 0.4) + (distress_score * 0.6));
        emotionDoc.distressBand = emotionDoc.distressScore >= 75 ? 'Severe' : (emotionDoc.distressScore >= 50 ? 'High' : 'Moderate');
      }
      if (emotion) emotionDoc.primaryEmotion = emotion;
      
      emotionDoc.recentLog.unshift({
        message: `[Voice] ${user_said.substring(0, 50)}...`,
        emotion: emotion || 'Neutral',
        distressScore: distress_score || emotionDoc.distressScore,
        timestamp: new Date()
      });
      if (emotionDoc.recentLog.length > 20) {
        emotionDoc.recentLog = emotionDoc.recentLog.slice(0, 20);
      }
      emotionDoc.isVoiceCallActive = true;
      await emotionDoc.save();
    }
  } catch (err) {
    console.error('Failed to update EmotionAnalysis for voice log:', err);
  }

  res.status(200).json({ success: true });
});

module.exports = {
  createSession,
  getSessions,
  getSessionMessages,
  sendMessage,
  archiveSession,
  submitCheckIn,
  triggerVoiceEscalation,
  endVoiceCall,
  startVoiceCall,
  logVoiceTurn
};
