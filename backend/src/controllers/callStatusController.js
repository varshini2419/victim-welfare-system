const asyncHandler = require('express-async-handler');
const twilio = require('twilio');
const CallLog = require('../models/CallLog');
const Alert = require('../models/Alert');

const statusMap = {
  initiated: 'INITIATED',
  ringing: 'INITIATED',
  answered: 'COMPLETED',
  completed: 'COMPLETED',
  busy: 'NO_ANSWER',
  'no-answer': 'NO_ANSWER',
  failed: 'FAILED',
  canceled: 'FAILED',
};

const verifyTwilioRequest = (req) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.get('X-Twilio-Signature');
  if (!authToken || !signature) return false;

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const url = `${protocol}://${host}${req.originalUrl}`;
  return twilio.validateRequest(authToken, signature, url, req.body);
};

const updateCallStatus = asyncHandler(async (req, res) => {
  if (!verifyTwilioRequest(req)) {
    res.status(403);
    throw new Error('Invalid voice provider callback signature');
  }

  const providerCallId = req.body.CallSid;
  const providerStatus = String(req.body.CallStatus || '').toLowerCase();
  const callStatus = statusMap[providerStatus];
  if (!providerCallId || !callStatus) {
    return res.status(204).end();
  }

  const callLog = await CallLog.findOne({ providerCallId });
  if (!callLog) {
    return res.status(204).end();
  }

  callLog.callStatus = callStatus;
  callLog.answeredAt = providerStatus === 'answered' ? new Date() : callLog.answeredAt;
  callLog.completedAt = ['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(providerStatus)
    ? new Date()
    : callLog.completedAt;
  await callLog.save();

  await Alert.findByIdAndUpdate(callLog.riskEventId, {
    callStatus,
    callFailureReason: callStatus === 'FAILED' || callStatus === 'NO_ANSWER' ? providerStatus : undefined,
  });

  res.status(204).end();
});

module.exports = { updateCallStatus };
