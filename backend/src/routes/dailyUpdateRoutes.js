const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createDailyUpdate,
  getMyDailyUpdates,
  getMyTodayDailyUpdate,
} = require('../controllers/dailyUpdateController');
const { validateDailyUpdateContent } = require('../validators/dailyUpdateValidator');

const router = express.Router();

router.use(protect);
router.use(authorize('victim'));

router.post('/', validateDailyUpdateContent, createDailyUpdate);
router.get('/today', getMyTodayDailyUpdate);
router.get('/', getMyDailyUpdates);

module.exports = router;
