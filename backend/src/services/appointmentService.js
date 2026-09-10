const Appointment = require('../models/Appointment');
const Assignment = require('../models/Assignment');
const Case = require('../models/Case');
const Counselor = require('../models/Counselor');
const Victim = require('../models/Victim');
const Notification = require('../models/Notification');

const ACTIVE_CASE_STATUSES = ['open', 'in-progress', 'assigned'];
const CONFIRMED_STATUS = 'CONFIRMED';

const serviceError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const resolveVictimContext = async (victimId, expectedCounselorUserId = null) => {
  const [victimCase, assignment] = await Promise.all([
    Case.findOne({ victimId, status: { $in: ACTIVE_CASE_STATUSES } })
      .sort({ assignedAt: -1, updatedAt: -1 })
      .lean(),
    Assignment.findOne({ victimId, status: 'active' }).lean(),
  ]);

  if (!victimCase || !assignment || !victimCase.assignedCounselorId) {
    throw serviceError(409, 'Victim case and active counselor assignment are required.');
  }

  const counselor = await Counselor.findById(victimCase.assignedCounselorId)
    .populate('userId', 'name email role status')
    .lean();

  const counselorUserId = counselor?.userId?._id || counselor?.userId;
  const consistent = counselor
    && String(counselorUserId) === String(assignment.counselorId)
    && (!expectedCounselorUserId || String(counselorUserId) === String(expectedCounselorUserId));

  if (!consistent) {
    throw serviceError(403, 'Victim case and counselor assignment do not resolve consistently.');
  }

  if (counselor.userId?.role !== 'counselor' || counselor.userId?.status !== 'active' || counselor.verificationStatus !== 'approved') {
    throw serviceError(409, 'Assigned counselor is not active and approved.');
  }

  return {
    victimId,
    victimCase,
    assignment,
    counselor,
    counselorUserId,
  };
};

const getAuthorizedAppointment = async (appointmentId, counselorUserId) => {
  const appointment = await Appointment.findById(appointmentId).lean();
  if (!appointment) throw serviceError(404, 'Appointment not found.');

  const context = await resolveVictimContext(appointment.victimId, counselorUserId);
  if (String(appointment.caseId) !== String(context.victimCase._id)
    || String(appointment.counselorId) !== String(context.counselorUserId)) {
    throw serviceError(403, 'Appointment is not assigned to this counselor.');
  }

  return { appointment, context };
};

const assertNoConflict = async ({ victimId, counselorId, scheduledAt, excludeId = null }) => {
  const query = {
    status: CONFIRMED_STATUS,
    scheduledAt: new Date(scheduledAt),
    $or: [{ counselorId }, { victimId }],
  };
  if (excludeId) query._id = { $ne: excludeId };

  const conflict = await Appointment.findOne(query).select('_id').lean();
  if (conflict) throw serviceError(409, 'The counselor or victim already has a confirmed appointment at that time.');
};

const attachProfiles = async (appointments) => {
  const items = Array.isArray(appointments) ? appointments : [appointments];
  const victimIds = items.map((item) => item.victimId?._id || item.victimId).filter(Boolean);
  const counselorIds = items.map((item) => item.counselorId?._id || item.counselorId).filter(Boolean);
  const [victims, counselors] = await Promise.all([
    Victim.find({ userId: { $in: victimIds } }).select('userId name phone state district').lean(),
    Counselor.find({ userId: { $in: counselorIds } }).select('userId name qualification profession').lean(),
  ]);
  const victimByUser = new Map(victims.map((victim) => [String(victim.userId), victim]));
  const counselorByUser = new Map(counselors.map((counselor) => [String(counselor.userId), counselor]));

  return items.map((item) => {
    const victim = victimByUser.get(String(item.victimId?._id || item.victimId));
    const counselor = counselorByUser.get(String(item.counselorId?._id || item.counselorId));
    if (victim && item.victimId && typeof item.victimId === 'object') item.victimId = { ...item.victimId, ...victim };
    if (counselor) item.counselor = counselor;
    return item;
  });
};

const appointmentView = async (appointment) => {
  const item = await Appointment.findById(appointment._id || appointment)
    .populate('victimId', 'email state district registrationId')
    .populate('caseId', 'caseId category status supportRequired')
    .populate('counselorId', 'email role status')
    .lean();
  return (await attachProfiles(item))[0];
};

const createVictimRequest = async ({ victimId, appointmentType, reason, scheduledAt }) => {
  const context = await resolveVictimContext(victimId);
  await assertNoConflict({ victimId, counselorId: context.counselorUserId, scheduledAt });

  const appointment = await Appointment.create({
    victimId,
    caseId: context.victimCase._id,
    counselorId: context.counselorUserId,
    createdBy: victimId,
    createdByRole: 'victim',
    appointmentType,
    reason,
    scheduledAt: new Date(scheduledAt),
    status: 'PENDING',
  });

  await Notification.create({
    recipientId: context.counselorUserId,
    senderId: victimId,
    type: 'appointment_request',
    appointmentId: appointment._id,
    message: 'Your assigned victim has requested an appointment.',
  });

  return appointmentView(appointment);
};

const listVictimAppointments = async (victimId) => Appointment.find({ victimId })
  .sort({ scheduledAt: 1, createdAt: -1 })
  .populate('caseId', 'caseId category status')
  .populate('counselorId', 'email role status')
  .lean()
  .then(attachProfiles);

const getVictimAppointment = async (appointmentId, victimId) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, victimId })
    .populate('caseId', 'caseId category status supportRequired')
    .populate('counselorId', 'email role status')
    .lean();
  if (!appointment) throw serviceError(404, 'Appointment not found.');
  return (await attachProfiles(appointment))[0];
};

const listCounselorAppointments = async (counselorUserId, pendingOnly = false) => {
  const counselor = await Counselor.findOne({ userId: counselorUserId }).lean();
  if (!counselor) throw serviceError(404, 'Counselor profile not found.');

  const cases = await Case.find({ assignedCounselorId: counselor._id, status: { $in: ACTIVE_CASE_STATUSES } })
    .select('victimId')
    .lean();
  const assignments = await Assignment.find({ counselorId: counselorUserId, status: 'active' }).select('victimId').lean();
  const assignedVictimIds = [...new Set([
    ...cases.map((item) => String(item.victimId)),
    ...assignments.map((item) => String(item.victimId)),
  ])];

  const query = {
    counselorId: counselorUserId,
    victimId: { $in: assignedVictimIds },
  };
  if (pendingOnly) query.status = 'PENDING';

  const appointments = await Appointment.find(query)
    .sort({ scheduledAt: 1, createdAt: -1 })
    .populate('victimId', 'email state district registrationId')
    .populate('caseId', 'caseId category status supportRequired')
    .lean();
  return attachProfiles(appointments);
};

const createCounselorAppointment = async ({ counselorUserId, victimId, appointmentType, reason, scheduledAt }) => {
  const context = await resolveVictimContext(victimId, counselorUserId);
  await assertNoConflict({ victimId, counselorId: counselorUserId, scheduledAt });

  const appointment = await Appointment.create({
    victimId,
    caseId: context.victimCase._id,
    counselorId: counselorUserId,
    createdBy: counselorUserId,
    createdByRole: 'counselor',
    appointmentType,
    reason,
    scheduledAt: new Date(scheduledAt),
    status: 'CONFIRMED',
    approvedAt: new Date(),
  });

  await Notification.create({
    recipientId: victimId,
    senderId: counselorUserId,
    type: 'appointment_scheduled',
    appointmentId: appointment._id,
    message: 'Your counselor scheduled a confirmed appointment for you.',
  });

  return appointmentView(appointment);
};

const approveAppointment = async ({ appointmentId, counselorUserId, scheduledAt }) => {
  const { appointment, context } = await getAuthorizedAppointment(appointmentId, counselorUserId);
  if (appointment.status !== 'PENDING') throw serviceError(400, 'Only pending appointments can be approved.');

  const nextScheduledAt = scheduledAt ? new Date(scheduledAt) : appointment.scheduledAt;
  if (nextScheduledAt <= new Date()) throw serviceError(400, 'Appointment must be scheduled in the future.');
  await assertNoConflict({ victimId: appointment.victimId, counselorId: counselorUserId, scheduledAt: nextScheduledAt, excludeId: appointment._id });

  const updated = await Appointment.findByIdAndUpdate(
    appointment._id,
    { status: 'CONFIRMED', scheduledAt: nextScheduledAt, approvedAt: new Date(), rejectionReason: undefined },
    { new: true, runValidators: true },
  );

  await Notification.create({
    recipientId: appointment.victimId,
    senderId: counselorUserId,
    type: 'appointment_confirmed',
    appointmentId: appointment._id,
    message: 'Your appointment request has been confirmed by your counselor.',
  });

  return appointmentView(updated);
};

const rejectAppointment = async ({ appointmentId, counselorUserId, rejectionReason }) => {
  const { appointment } = await getAuthorizedAppointment(appointmentId, counselorUserId);
  if (appointment.status !== 'PENDING') throw serviceError(400, 'Only pending appointments can be rejected.');

  const updated = await Appointment.findByIdAndUpdate(
    appointment._id,
    { status: 'REJECTED', rejectionReason: rejectionReason || undefined },
    { new: true, runValidators: true },
  );

  await Notification.create({
    recipientId: appointment.victimId,
    senderId: counselorUserId,
    type: 'appointment_rejected',
    appointmentId: appointment._id,
    message: 'Your appointment request was rejected by your counselor.',
  });

  return appointmentView(updated);
};

const completeAppointment = async ({ appointmentId, counselorUserId }) => {
  const { appointment } = await getAuthorizedAppointment(appointmentId, counselorUserId);
  if (appointment.status !== 'CONFIRMED') throw serviceError(400, 'Only confirmed appointments can be completed.');

  const updated = await Appointment.findByIdAndUpdate(
    appointment._id,
    { status: 'COMPLETED', completedAt: new Date() },
    { new: true, runValidators: true },
  );

  return appointmentView(updated);
};

const updateConsultationNotes = async ({ appointmentId, counselorUserId, consultationNotes }) => {
  const { appointment } = await getAuthorizedAppointment(appointmentId, counselorUserId);
  if (appointment.status !== 'COMPLETED') throw serviceError(400, 'Consultation notes can be saved after completion.');

  const updated = await Appointment.findByIdAndUpdate(
    appointment._id,
    { consultationNotes },
    { new: true, runValidators: true },
  );

  return appointmentView(updated);
};

module.exports = {
  resolveVictimContext,
  getAuthorizedAppointment,
  createVictimRequest,
  listVictimAppointments,
  getVictimAppointment,
  listCounselorAppointments,
  createCounselorAppointment,
  approveAppointment,
  rejectAppointment,
  completeAppointment,
  updateConsultationNotes,
};
