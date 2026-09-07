const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
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

const processVictimMessage = async (sessionId, victimId, content) => {
  // 1. Verify session exists and belongs to the victim (prevent IDOR)
  const session = await ChatSession.findOne({ _id: sessionId, victimId, status: 'active' });
  if (!session) {
    const error = new Error('Session not found or not active');
    error.status = 404;
    throw error;
  }

  // 2. Perform lightweight safety check
  const isFlagged = performSafetyCheck(content);

  // 3. Save victim message
  const userMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType: 'victim',
    content,
    isFlagged
  });

  // 4. Update session lastMessageAt
  session.lastMessageAt = Date.now();
  // Set title if it's the first message and currently defaults to 'New Conversation'
  if (session.title === 'New Conversation') {
    session.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }
  await session.save();

  // 5. Determine AI Response
  let aiContent = '';
  let aiIsFlagged = false;
  let senderType = 'ai';

  if (isFlagged) {
    // Immediate fallback to safety response, no AI call needed
    aiContent = getSafetyResponse();
    aiIsFlagged = true;
    senderType = 'system';
  } else {
    try {
      // Fetch context window (e.g., last 15 messages)
      const contextLimit = parseInt(process.env.CHAT_CONTEXT_MESSAGES) || 15;
      
      const previousMessages = await ChatMessage.find({ sessionId: session._id })
        .sort({ createdAt: -1 })
        .limit(contextLimit);
        
      // Reverse to chronological order
      previousMessages.reverse();

      // Format for AI service
      const messagesArray = previousMessages.map(msg => ({
        role: msg.senderType === 'victim' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Call AI Service
      aiContent = await aiService.getChatbotResponse(messagesArray);
      
    } catch (error) {
      console.error('[ChatbotService AI Error]:', error.message);
      const aiError = new Error('The assistant is temporarily unavailable. Please try again shortly.');
      aiError.status = 503;
      throw aiError;
    }
  }

  // 6. Save AI/System Response
  const aiMessage = await ChatMessage.create({
    sessionId: session._id,
    senderType,
    content: aiContent,
    isFlagged: aiIsFlagged
  });

  return { userMessage, aiMessage };
};

module.exports = {
  processVictimMessage
};
