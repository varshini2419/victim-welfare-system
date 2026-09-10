const asyncHandler = require('express-async-handler');
const appointmentService = require('../services/appointmentService');

const appointmentHandler = (handler) => asyncHandler(async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    if (error.status) res.status(error.status);
    throw error;
  }
});

const victimCreateAppointmentRequest = appointmentHandler(async (req, res) => {
  const appointment = await appointmentService.createVictimRequest({
    victimId: req.user._id,
    appointmentType: req.body.appointmentType,
    reason: req.body.reason,
    scheduledAt: req.body.scheduledAt,
  });
  res.status(201).json({ success: true, data: appointment, message: 'Appointment request sent to your counselor.' });
});

const victimGetAppointments = appointmentHandler(async (req, res) => {
  const appointments = await appointmentService.listVictimAppointments(req.user._id);
  res.json({ success: true, data: appointments });
});

const victimGetAppointment = appointmentHandler(async (req, res) => {
  const appointment = await appointmentService.getVictimAppointment(req.params.id, req.user._id);
  res.json({ success: true, data: appointment });
});

const counselorGetAppointments = appointmentHandler(async (req, res) => {
  const appointments = await appointmentService.listCounselorAppointments(req.user._id);
  res.json({ success: true, data: appointments });
});

const counselorGetPendingRequests = appointmentHandler(async (req, res) => {
  const appointments = await appointmentService.listCounselorAppointments(req.user._id, true);
  res.json({ success: true, data: appointments });
});

const counselorGetAppointment = appointmentHandler(async (req, res) => {
  const { appointment } = await appointmentService.getAuthorizedAppointment(req.params.id, req.user._id);
  const data = await appointmentService.getVictimAppointment(appointment._id, appointment.victimId);
  res.json({ success: true, data });
});

const counselorCreateAppointment = appointmentHandler(async (req, res) => {
  const appointment = await appointmentService.createCounselorAppointment({
    counselorUserId: req.user._id,
    victimId: req.body.victimId,
    appointmentType: req.body.appointmentType,
    reason: req.body.reason,
    scheduledAt: req.body.scheduledAt,
  });
  res.status(201).json({ success: true, data: appointment, message: 'Appointment scheduled successfully.' });
});

const counselorApproveAppointment = appointmentHandler(async (req, res) => {
  const appointment = await appointmentService.approveAppointment({
    appointmentId: req.params.id,
    counselorUserId: req.user._id,
    scheduledAt: req.body.scheduledAt,
  });
  res.json({ success: true, data: appointment, message: 'Appointment confirmed.' });
});

const counselorRejectAppointment = appointmentHandler(async (req, res) => {
  const appointment = await appointmentService.rejectAppointment({
    appointmentId: req.params.id,
    counselorUserId: req.user._id,
    rejectionReason: req.body.rejectionReason,
  });
  res.json({ success: true, data: appointment, message: 'Appointment rejected.' });
});

const counselorCompleteAppointment = appointmentHandler(async (req, res) => {
  const appointment = await appointmentService.completeAppointment({
    appointmentId: req.params.id,
    counselorUserId: req.user._id,
  });
  res.json({ success: true, data: appointment, message: 'Appointment marked as completed.' });
});

const counselorUpdateConsultationNotes = appointmentHandler(async (req, res) => {
  const appointment = await appointmentService.updateConsultationNotes({
    appointmentId: req.params.id,
    counselorUserId: req.user._id,
    consultationNotes: req.body.consultationNotes,
  });
  res.json({ success: true, data: appointment, message: 'Consultation notes saved.' });
});

module.exports = {
  victimCreateAppointmentRequest,
  victimGetAppointments,
  victimGetAppointment,
  counselorGetAppointments,
  counselorGetPendingRequests,
  counselorGetAppointment,
  counselorCreateAppointment,
  counselorApproveAppointment,
  counselorRejectAppointment,
  counselorCompleteAppointment,
  counselorUpdateConsultationNotes,
};