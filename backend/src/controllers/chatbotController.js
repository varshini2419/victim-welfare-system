const asyncHandler = require('express-async-handler');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
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

module.exports = {
  createSession,
  getSessions,
  getSessionMessages,
  sendMessage,
  archiveSession,
  submitCheckIn
};
