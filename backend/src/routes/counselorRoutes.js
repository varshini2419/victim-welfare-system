const express = require('express');
const router = express.Router();
const { getMyVictims } = require('../controllers/counselorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('counselor'));

router.get('/victims', getMyVictims);

module.exports = router;
