const express = require('express');
const router = express.Router();
const { getMyVictims, getVictimProfileById, getMyProfile, getAssignedCases, getAssignedCaseById, streamAssignedCaseDocument } = require('../controllers/counselorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('counselor'));

router.get('/profile', getMyProfile);
router.get('/victims', getMyVictims);
router.get('/victims/:id', getVictimProfileById);
router.get('/assigned-cases', getAssignedCases);
router.get('/assigned-cases/:id', getAssignedCaseById);
router.get('/documents/:filename', streamAssignedCaseDocument);

module.exports = router;
