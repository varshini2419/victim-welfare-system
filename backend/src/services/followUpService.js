const Assignment = require('../models/Assignment');
const Case = require('../models/Case');
const Counselor = require('../models/Counselor');
const Victim = require('../models/Victim');
const DailyUpdate = require('../models/DailyUpdate');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');

const ACTIVE_CASE_STATUSES = ['open', 'in-progress', 'assigned', 'resolved'];

const serviceError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const resolveAssignedVictim = async (counselorUserId, victimId) => {
  const counselor = await Counselor.findOne({ userId: counselorUserId }).lean();
  if (!counselor) throw serviceError(404, 'Counselor profile not found.');

  const [victimCase, assignment] = await Promise.all([
    Case.findOne({
      victimId,
      assignedCounselorId: counselor._id,
      status: { $in: ACTIVE_CASE_STATUSES },
    }).sort({ assignedAt: -1, updatedAt: -1 }).lean(),
    Assignment.findOne({ victimId, counselorId: counselorUserId, status: 'active' }).lean(),
  ]);

  if (!victimCase || !assignment || String(assignment.counselorId) !== String(counselorUserId)) {
    throw serviceError(403, 'This victim is not assigned to the authenticated counselor.');
  }

  return { counselor, victimCase, assignment };
};

const listAssignedVictims = async (counselorUserId) => {
  const counselor = await Counselor.findOne({ userId: counselorUserId }).lean();
  if (!counselor) throw serviceError(404, 'Counselor profile not found.');

  const caseRecords = await Case.find({
    assignedCounselorId: counselor._id,
    status: { $in: ACTIVE_CASE_STATUSES },
  }).select('victimId caseId category status assignedAt').lean();
  const activeAssignments = await Assignment.find({
    counselorId: counselorUserId,
    status: 'active',
    victimId: { $in: caseRecords.map((item) => item.victimId) },
  }).select('victimId').lean();
  const activeVictimIds = new Set(activeAssignments.map((item) => String(item.victimId)));
  const validCases = caseRecords.filter((item) => activeVictimIds.has(String(item.victimId)));
  const victims = await Victim.find({ userId: { $in: validCases.map((item) => item.victimId) } })
    .select('userId name state district')
    .lean();
  const victimByUser = new Map(victims.map((item) => [String(item.userId), item]));

  return validCases.map((item) => {
    const victim = victimByUser.get(String(item.victimId));
    return {
      victimId: item.victimId,
      name: victim?.name || 'Assigned Victim',
      state: victim?.state || 'N/A',
      district: victim?.district || 'N/A',
      caseId: item.caseId || item._id,
      caseRecordId: item._id,
      category: item.category,
      status: item.status,
      assignedAt: item.assignedAt,
    };
  });
};

const getFollowUp = async (counselorUserId, victimId) => {
  const { victimCase } = await resolveAssignedVictim(counselorUserId, victimId);
  const [victim, dailyUpdates, alerts] = await Promise.all([
    Victim.findOne({ userId: victimId }).select('userId name state district').lean(),
    DailyUpdate.find({ victimId })
      .select('feeling content createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean(),
    Alert.find({ victimId, caseId: victimCase._id })
      .select('caseId victimId severity alertType description source riskScore riskLevel callLogId callStatus callFailureReason status acknowledgedAt acknowledgedBy actionTaken resolvedAt resolvedBy createdAt updatedAt')
      .populate('callLogId', 'callStatus providerCallId initiatedAt answeredAt completedAt failureReason callType')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    victim: {
      userId: victimId,
      name: victim?.name || 'Assigned Victim',
      state: victim?.state || 'N/A',
      district: victim?.district || 'N/A',
    },
    caseInfo: {
      caseId: victimCase.caseId || victimCase._id,
      caseRecordId: victimCase._id,
      category: victimCase.category,
      status: victimCase.status,
      assignedAt: victimCase.assignedAt,
    },
    dailyUpdates,
    alerts,
  };
};

const updateAlertStatus = async ({ counselorUserId, alertId, status }) => {
  const alert = await Alert.findById(alertId).lean();
  if (!alert) throw serviceError(404, 'Follow-up alert not found.');

  const { victimCase } = await resolveAssignedVictim(counselorUserId, alert.victimId);
  if (String(alert.caseId) !== String(victimCase._id)) {
    throw serviceError(403, 'Alert does not belong to the assigned case.');
  }
  const allowedTransitions = {
    NEW: ['ACKNOWLEDGED'],
    ACKNOWLEDGED: ['IN_PROGRESS'],
    IN_PROGRESS: [],
    RESOLVED: [],
  };
  if (!allowedTransitions[alert.status]?.includes(status)) {
    throw serviceError(400, `Invalid alert transition from ${alert.status} to ${status}.`);
  }

  const update = { status };
  if (status === 'ACKNOWLEDGED') {
    update.acknowledgedAt = new Date();
    update.acknowledgedBy = counselorUserId;
  }
  return Alert.findByIdAndUpdate(alertId, update, { new: true, runValidators: true }).lean();
};

const resolveAlert = async ({ counselorUserId, alertId, actionTaken }) => {
  const alert = await Alert.findById(alertId).lean();
  if (!alert) throw serviceError(404, 'Follow-up alert not found.');

  const { victimCase } = await resolveAssignedVictim(counselorUserId, alert.victimId);
  if (String(alert.caseId) !== String(victimCase._id)) {
    throw serviceError(403, 'Alert does not belong to the assigned case.');
  }
  if (alert.status !== 'IN_PROGRESS') {
    throw serviceError(400, 'Only in-progress alerts can be resolved.');
  }

  const updated = await Alert.findByIdAndUpdate(
    alertId,
    {
      status: 'RESOLVED',
      actionTaken: actionTaken.trim(),
      resolvedBy: counselorUserId,
      resolvedAt: new Date(),
    },
    { new: true, runValidators: true },
  ).lean();

  await AuditLog.create({
    actorId: counselorUserId,
    actorRole: 'counselor',
    action: 'FOLLOW_UP_RESOLVED',
    targetType: 'Alert',
    targetId: alert._id,
    caseId: victimCase.caseId,
    metadata: {
      actionTaken: actionTaken.trim(),
      previousStatus: alert.status,
      newStatus: updated.status,
    },
  });

  return updated;
};

module.exports = {
  resolveAssignedVictim,
  listAssignedVictims,
  getFollowUp,
  updateAlertStatus,
  resolveAlert,
};
