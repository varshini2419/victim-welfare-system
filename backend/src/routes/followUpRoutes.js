const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getFollowUpVictims,
  getFollowUp,
  updateAlertStatus,
  resolveAlert,
} = require('../controllers/followUpController');
const {
  validateAlertStatus,
  validateAlertResolution,
} = require('../validators/dailyUpdateValidator');

const router = express.Router();

router.use(protect);
router.use(authorize('counselor'));

router.get('/', getFollowUpVictims);
router.get('/:victimId', getFollowUp);
router.patch('/alerts/:alertId/status', validateAlertStatus, updateAlertStatus);
router.patch('/alerts/:alertId/resolve', validateAlertResolution, resolveAlert);

module.exports = router;
