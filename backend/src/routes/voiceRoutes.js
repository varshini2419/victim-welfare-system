const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { requestEmergencyHelp } = require('../controllers/voiceController');
const { emergencyLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post('/request-help', protect, authorize('victim'), emergencyLimiter, requestEmergencyHelp);

module.exports = router;
