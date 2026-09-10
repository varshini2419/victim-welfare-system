const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  counselorGetAppointments,
  counselorGetPendingRequests,
  counselorGetAppointment,
  counselorCreateAppointment,
  counselorApproveAppointment,
  counselorRejectAppointment,
  counselorCompleteAppointment,
  counselorUpdateConsultationNotes,
} = require('../controllers/appointmentController');
const {
  createCounselorAppointment,
  approveAppointment,
  rejectAppointment,
  notesAppointment,
  appointmentId,
} = require('../validators/appointmentValidator');

const router = express.Router();

router.use(protect);
router.use(authorize('counselor'));

router.get('/pending', counselorGetPendingRequests);
router.post('/', createCounselorAppointment, counselorCreateAppointment);
router.get('/', counselorGetAppointments);
router.get('/:id', appointmentId, counselorGetAppointment);
router.patch('/:id/approve', appointmentId, approveAppointment, counselorApproveAppointment);
router.patch('/:id/reject', appointmentId, rejectAppointment, counselorRejectAppointment);
router.patch('/:id/complete', appointmentId, counselorCompleteAppointment);
router.patch('/:id/notes', appointmentId, notesAppointment, counselorUpdateConsultationNotes);

module.exports = router;