const express = require('express');
const router = express.Router();
const { getMyVictims, getVictimProfileById, getVictimMentalHealthDashboard, getMyProfile, updateMyProfile, getAssignedCases, getAssignedCaseById, streamAssignedCaseDocument } = require('../controllers/counselorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(authorize('counselor'));

router.get('/profile', getMyProfile);
router.put('/profile', upload.single('profileImage'), updateMyProfile);
router.get('/victims', getMyVictims);
router.get('/victims/:id', getVictimProfileById);
router.get('/victims/:id/dashboard', getVictimMentalHealthDashboard);
router.get('/assigned-cases', getAssignedCases);
router.get('/assigned-cases/:id', getAssignedCaseById);
router.get('/documents/:filename', streamAssignedCaseDocument);

module.exports = router;
