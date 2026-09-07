const express = require('express');
const router = express.Router();
const { getMyCounselor, requestSupport } = require('../controllers/victimController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(authorize('victim'));

router.get('/counselor', getMyCounselor);
router.post('/request-support', chatLimiter, requestSupport);

module.exports = router;
