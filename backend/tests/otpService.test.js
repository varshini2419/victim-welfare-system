const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const Module = require('node:module');
const { createOtp, OTP_EXPIRY_MINUTES } = require('../src/services/otpService');

const originalLoad = Module._load;
const twilioCalls = [];
let twilioCreateError = null;

Module._load = function (request, parent, isMain) {
  if (request === 'twilio') {
    return (accountSid, authToken) => ({
      messages: {
        create: async payload => {
          twilioCalls.push({ accountSid, authToken, payload });
          if (twilioCreateError) throw twilioCreateError;
          return { sid: 'SM-mock-message-id' };
        }
      }
    });
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { sendApprovalSMS, sendLoginOtpSMS, normalizeIndianMobile } = require('../src/services/smsService');

const originalEnv = { ...process.env };

const configureTwilio = (overrides = {}) => {
  process.env.TWILIO_ACCOUNT_SID = 'AC-mock-account';
  process.env.TWILIO_AUTH_TOKEN = 'mock-auth-token';
  process.env.TWILIO_PHONE_NUMBER = '+15005550006';
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  Object.assign(process.env, overrides);
};

test.afterEach(() => {
  twilioCalls.length = 0;
  twilioCreateError = null;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

test('creates a six-digit hashed OTP with a short expiry', async () => {
  const before = Date.now();
  const otp = await createOtp();

  assert.match(otp.value, /^\d{6}$/);
  assert.notEqual(otp.hash, otp.value);
  assert.equal(await bcrypt.compare(otp.value, otp.hash), true);
  assert.ok(otp.expiresAt.getTime() > before);
  assert.ok(otp.expiresAt.getTime() <= before + (OTP_EXPIRY_MINUTES + 1) * 60 * 1000);
});

test('normalizes Indian phone numbers to E.164', () => {
  assert.equal(normalizeIndianMobile('9876543210'), '+919876543210');
  assert.equal(normalizeIndianMobile('919876543210'), '+919876543210');
  assert.equal(normalizeIndianMobile('+919876543210'), '+919876543210');
  assert.equal(normalizeIndianMobile('91919876543210'), null);
});

test('sends approval SMS through Twilio with a phone sender', async () => {
  configureTwilio();

  const result = await sendApprovalSMS('9876543210', 'Test Victim', 'ARH-2026-001', '123456');
  const call = twilioCalls[0];

  assert.deepEqual(result, { success: true, messageId: 'SM-mock-message-id' });
  assert.equal(call.payload.to, '+919876543210');
  assert.equal(call.payload.from, '+15005550006');
  assert.equal(call.payload.messagingServiceSid, undefined);
  assert.match(call.payload.body, /Test Victim/);
  assert.match(call.payload.body, /ARH-2026-001/);
  assert.match(call.payload.body, /123456/);
  assert.equal(call.accountSid, 'AC-mock-account');
  assert.equal(call.authToken, 'mock-auth-token');
});

test('prefers Twilio Messaging Service SID over phone sender', async () => {
  configureTwilio({ TWILIO_MESSAGING_SERVICE_SID: 'MG-mock-service' });

  await sendApprovalSMS('+919876543210', 'Test Victim', 'ARH-2026-002', '654321');
  const payload = twilioCalls[0].payload;

  assert.equal(payload.messagingServiceSid, 'MG-mock-service');
  assert.equal(payload.from, undefined);
  assert.equal(payload.to, '+919876543210');
});

test('returns safe errors for missing Twilio configuration and provider failures', async () => {
  configureTwilio();
  delete process.env.TWILIO_ACCOUNT_SID;
  let result = await sendApprovalSMS('9876543210', 'Test Victim', 'ARH-2026-003', '123456');
  assert.equal(result.success, false);
  assert.match(result.error, /TWILIO_ACCOUNT_SID|configuration/i);

  configureTwilio();
  delete process.env.TWILIO_PHONE_NUMBER;
  result = await sendApprovalSMS('9876543210', 'Test Victim', 'ARH-2026-003', '123456');
  assert.equal(result.success, false);
  assert.match(result.error, /sender configuration/i);

  configureTwilio();
  twilioCreateError = Object.assign(new Error('provider details must not leak'), { code: 21610 });
  result = await sendApprovalSMS('9876543210', 'Test Victim', 'ARH-2026-003', '123456');
  assert.equal(result.success, false);
  assert.match(result.error, /Twilio SMS request failed.*21610/);
});

test('sends login OTP SMS with login-specific message', async () => {
  configureTwilio();

  const result = await sendLoginOtpSMS('9876543210', 'Test Victim', 'ARH-2026-001', '852963');
  const call = twilioCalls[0];

  assert.deepEqual(result, { success: true, messageId: 'SM-mock-message-id' });
  assert.equal(call.payload.to, '+919876543210');
  assert.equal(call.payload.from, '+15005550006');
  assert.match(call.payload.body, /login OTP for Case ID: ARH-2026-001 is 852963/);
  assert.match(call.payload.body, /Valid for 15 minutes/);
});