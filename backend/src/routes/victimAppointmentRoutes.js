const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  victimCreateAppointmentRequest,
  victimGetAppointments,
  victimGetAppointment,
} = require('../controllers/appointmentController');
const {
  createVictimAppointment,
  appointmentId,
} = require('../validators/appointmentValidator');

const router = express.Router();

router.use(protect);
router.use(authorize('victim'));

router.post('/', createVictimAppointment, victimCreateAppointmentRequest);
router.get('/', victimGetAppointments);
router.get('/:id', appointmentId, victimGetAppointment);

module.exports = router;