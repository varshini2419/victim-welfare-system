const Assignment = require('../models/Assignment');
const Case = require('../models/Case');
const CallLog = require('../models/CallLog');
const Notification = require('../models/Notification');
const Counselor = require('../models/Counselor');
const { initiateEmergencyCall, normalizePhone } = require('./voiceService');

const ACTIVE_CASE_STATUSES = ['open', 'in-progress', 'assigned', 'resolved'];

const resolveAssignedCounselor = async (victimId) => {
  const [victimCase, assignment] = await Promise.all([
    Case.findOne({ victimId, status: { $in: ACTIVE_CASE_STATUSES } })
      .sort({ assignedAt: -1, updatedAt: -1 })
      .lean(),
    Assignment.findOne({ victimId, status: 'active' }).lean(),
  ]);

  if (!victimCase || !assignment || !victimCase.assignedCounselorId) {
    return { ok: false, reason: 'COUNSELOR_ASSIGNMENT_UNRESOLVED', victimCase, assignment };
  }

  const counselor = await Counselor.findById(victimCase.assignedCounselorId)
    .populate('userId', 'status role')
    .lean();
  if (!counselor || String(counselor.userId?._id || counselor.userId) !== String(assignment.counselorId)) {
    return { ok: false, reason: 'COUNSELOR_ASSIGNMENT_CONFLICT', victimCase, assignment, counselor };
  }

  if (counselor.userId?.status !== 'active' || counselor.userId?.role !== 'counselor') {
    return { ok: false, reason: 'COUNSELOR_INACTIVE', victimCase, assignment, counselor };
  }

  if (!counselor.phone) {
    return { ok: false, reason: 'COUNSELOR_PHONE_MISSING', victimCase, assignment, counselor };
  }

  const normalizedPhone = normalizePhone(counselor.phone);
  if (!normalizedPhone) {
    return { ok: false, reason: 'INVALID_COUNSELOR_PHONE', victimCase, assignment, counselor };
  }

  return { ok: true, victimCase, assignment, counselor, normalizedPhone };
};

const createFailedCallLog = async ({ victimId, caseId, counselorId, riskEventId, riskScore, riskLevel, callType, reason }) => {
  return CallLog.create({
    victimId,
    caseId,
    counselorId,
    riskEventId,
    riskScore,
    riskLevel,
    callType,
    callStatus: 'FAILED',
    failureReason: reason,
  });
};

const initiateAutomaticCall = async ({ victimId, riskEvent }) => {
  const riskLevel = riskEvent.riskLevel;
  const callType = riskLevel === 'CRITICAL' ? 'AI_CRITICAL_RISK' : 'AI_HIGH_RISK';
  const riskScore = riskEvent.riskScore || 0;
  const resolution = await resolveAssignedCounselor(victimId);

  if (!resolution.ok) {
    riskEvent.callStatus = 'FAILED';
    riskEvent.callFailureReason = resolution.reason;
    await riskEvent.save();
    return {
      initiated: false,
      reason: resolution.reason,
      callLog: null,
    };
  }

  const existingCall = await CallLog.findOne({
    riskEventId: riskEvent._id,
    counselorId: resolution.counselor._id,
  });
  if (existingCall) {
    return { initiated: false, duplicate: true, callLog: existingCall };
  }

  const callLog = await CallLog.create({
    victimId,
    caseId: resolution.victimCase._id,
    counselorId: resolution.counselor._id,
    riskEventId: riskEvent._id,
    riskScore,
    riskLevel,
    callType,
    callStatus: 'PENDING',
  });

  riskEvent.caseId = resolution.victimCase._id;
  riskEvent.callLogId = callLog._id;
  riskEvent.callStatus = 'PENDING';
  await riskEvent.save();

  const enabled = process.env.AUTO_RISK_CALLS_ENABLED === 'true';
  if (!enabled) {
    callLog.callStatus = 'FAILED';
    callLog.failureReason = 'AUTO_RISK_CALLS_DISABLED';
    await callLog.save();
    riskEvent.callStatus = 'FAILED';
    riskEvent.callFailureReason = 'AUTO_RISK_CALLS_DISABLED';
    await riskEvent.save();
    await Notification.create({
      recipientId: resolution.counselor.userId._id,
      type: 'high_risk_call',
      alertId: riskEvent._id,
      callLogId: callLog._id,
      message: `A ${riskLevel.toLowerCase()} AI risk event requires counselor follow-up; automatic calling is disabled.`,
    });
    return { initiated: false, dryRun: true, reason: 'AUTO_RISK_CALLS_DISABLED', callLog };
  }

  const callResult = await initiateEmergencyCall(resolution.counselor.phone, {
    callType,
    riskLevel,
  });

  callLog.callStatus = callResult.success ? 'INITIATED' : 'FAILED';
  callLog.providerCallId = callResult.callSid;
  callLog.initiatedAt = callResult.success ? new Date() : undefined;
  callLog.failureReason = callResult.success ? undefined : callResult.code;
  await callLog.save();

  riskEvent.callStatus = callLog.callStatus;
  riskEvent.callFailureReason = callLog.failureReason;
  await riskEvent.save();

  await Notification.create({
    recipientId: resolution.counselor.userId._id,
    type: 'high_risk_call',
    alertId: riskEvent._id,
    callLogId: callLog._id,
    message: callResult.success
      ? `A ${riskLevel.toLowerCase()} AI risk event triggered an automatic counselor call.`
      : `A ${riskLevel.toLowerCase()} AI risk event requires counselor follow-up; automatic call failed.`,
  });

  return { initiated: callResult.success, reason: callResult.code, callLog };
};

module.exports = {
  resolveAssignedCounselor,
  initiateAutomaticCall,
  createFailedCallLog,
};
