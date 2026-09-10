const express = require('express');
const router = express.Router();
const { getMyCounselor, requestSupport, getMyProfile, getMyCase, streamMyDocument } = require('../controllers/victimController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimitMiddleware');
const { getMyVictimNotifications, markVictimNotificationRead } = require('../controllers/notificationController');

router.use(protect);
router.use(authorize('victim'));

router.get('/my-profile', getMyProfile);
router.get('/my-case', getMyCase);
router.get('/documents/:filename', streamMyDocument);
router.get('/counselor', getMyCounselor);
router.post('/request-support', chatLimiter, requestSupport);
router.get('/notifications', getMyVictimNotifications);
router.patch('/notifications/:id/read', markVictimNotificationRead);

module.exports = router;
