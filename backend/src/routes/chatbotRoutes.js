const express = require('express');
const router = express.Router();
const { 
  createSession,
  getSessions,
  getSessionMessages,
  sendMessage,
  archiveSession,
  submitCheckIn
} = require('../controllers/chatbotController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimitMiddleware');
const { validateSessionId, validateMessage } = require('../validators/chatbotValidator');

// Apply authentication and role guard to all routes
router.use(protect);
router.use(authorize('victim'));

router.post('/checkin', submitCheckIn);

router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id/messages', validateSessionId, getSessionMessages);
router.post('/sessions/:id/messages', chatLimiter, validateMessage, sendMessage);
router.delete('/sessions/:id', validateSessionId, archiveSession);

module.exports = router;
