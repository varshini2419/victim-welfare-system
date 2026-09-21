const express = require('express');
const router = express.Router();
const {
  getMyVictims,
  getVictimProfileById,
  getVictimMentalHealthDashboard,
  getMyProfile,
  getAssignedCases,
  getAssignedCaseById,
  streamAssignedCaseDocument,
  getMyAppointments,
  createAppointment,
  updateAppointmentStatus,
  getFollowUps,
  getVictimChats,
  getCounselorSummary,
  searchCounselorCaseload,
  getCounselorNotifications,
  acknowledgeAlert,
} = require('../controllers/counselorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// ── Shared victim-inspection routes (counselor + admin supervision) ──
// verifyCounselorVictimAccess authorizes admins, letting supervisors reuse the
// exact same dashboard payloads as the assigned counselor. Registered before
// the counselor-only guard below.
router.get(
  '/victims/:id/dashboard',
  authorize('counselor', 'admin'),
  getVictimMentalHealthDashboard
);
router.get(
  '/victims/:id/chats',
  authorize('counselor', 'admin'),
  getVictimChats
);

router.use(authorize('counselor'));

// ── Shell / cross-cutting ───────────────────────────────────────
router.get('/summary', getCounselorSummary);
router.get('/search', searchCounselorCaseload);
router.get('/notifications', getCounselorNotifications);
router.patch('/notifications/alerts/:id/acknowledge', acknowledgeAlert);

router.get('/profile', getMyProfile);
router.get('/victims', getMyVictims);
router.get('/victims/:id', getVictimProfileById);
router.get('/follow-ups', getFollowUps);
router.get('/assigned-cases', getAssignedCases);
router.get('/assigned-cases/:id', getAssignedCaseById);
router.get('/documents/:filename', streamAssignedCaseDocument);

// ── Appointments ──────────────────────────────────────────────────
router.get('/appointments', getMyAppointments);
router.post('/appointments', createAppointment);
router.patch('/appointments/:id', updateAppointmentStatus);

module.exports = router;
