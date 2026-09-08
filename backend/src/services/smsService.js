const twilio = require('twilio');

const normalizeIndianMobile = (phone, countryCode = '91') => {
  const digits = String(phone || '').replace(/\D/g, '');
  const code = String(countryCode || '91').replace(/\D/g, '') || '91';

  if (digits.length === 10) return `+${code}${digits}`;
  if (digits.length === code.length + 10 && digits.startsWith(code)) return `+${digits}`;
  if (digits.length === code.length + 12 && digits.startsWith(`00${code}`)) return `+${digits.slice(2)}`;

  return null;
};

/**
 * Build an authenticated Twilio client.
 *
 * Supports two credential modes detected automatically from environment:
 *
 *   Mode A — Account Auth Token (preferred for simplicity)
 *     TWILIO_ACCOUNT_SID  = ACxxxxxxxx...
 *     TWILIO_AUTH_TOKEN   = <32-char hex, does NOT start with SK>
 *
 *   Mode B — API Key pair (preferred for production key rotation)
 *     TWILIO_ACCOUNT_SID  = ACxxxxxxxx...
 *     TWILIO_API_KEY      = SKxxxxxxxx...
 *     TWILIO_API_SECRET   = <api key secret>
 *
 * If TWILIO_AUTH_TOKEN starts with "SK", it is recognised as an API Key SID
 * and Mode B is used automatically (requires TWILIO_API_SECRET to also be set).
 */
const buildTwilioClient = () => {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID) {
    return { client: null, error: 'TWILIO_ACCOUNT_SID is not set.' };
  }

  // Mode B: explicit API Key vars take priority
  if (TWILIO_API_KEY && TWILIO_API_SECRET) {
    console.log('[SMS] Auth mode: API Key (TWILIO_API_KEY + TWILIO_API_SECRET)');
    return {
      client: twilio(TWILIO_API_KEY, TWILIO_API_SECRET, { accountSid: TWILIO_ACCOUNT_SID }),
      error: null,
    };
  }

  // Mode B fallback: TWILIO_AUTH_TOKEN is actually an API Key SID (starts with SK)
  if (TWILIO_AUTH_TOKEN?.startsWith('SK')) {
    console.warn(
      '[SMS] WARNING: TWILIO_AUTH_TOKEN starts with "SK" — this is an API Key SID, not an Auth Token.\n' +
      '       To fix: either set TWILIO_API_KEY=SK... and TWILIO_API_SECRET=<secret>, \n' +
      '       OR replace TWILIO_AUTH_TOKEN with your real Account Auth Token from Twilio Console.'
    );
    return {
      client: null,
      error:
        'Twilio credential misconfiguration: TWILIO_AUTH_TOKEN contains an API Key SID (SK...) ' +
        'instead of the Account Auth Token. ' +
        'Set TWILIO_API_KEY + TWILIO_API_SECRET, or use the Account Auth Token.',
    };
  }

  // Mode A: Account Auth Token
  if (!TWILIO_AUTH_TOKEN) {
    return { client: null, error: 'TWILIO_AUTH_TOKEN is not set.' };
  }

  console.log('[SMS] Auth mode: Account Auth Token');
  return {
    client: twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
    error: null,
  };
};

const sendApprovalSMS = async (phone, name, caseId, otp) => {
  const {
    TWILIO_PHONE_NUMBER,
    TWILIO_MESSAGING_SERVICE_SID,
  } = process.env;

  // Build client — detect credential mode automatically
  const { client, error: authError } = buildTwilioClient();
  if (authError) {
    console.error('[SMS] Auth error:', authError);
    return { success: false, error: authError };
  }

  if (!TWILIO_PHONE_NUMBER && !TWILIO_MESSAGING_SERVICE_SID) {
    return { success: false, error: 'Twilio sender configuration is incomplete (set TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID).' };
  }

  const mobile = normalizeIndianMobile(phone);
  if (!mobile) {
    return { success: false, error: 'Victim phone number is not a valid Indian mobile number.' };
  }

  try {
    const message = [
      `AAROHAN: Dear ${name}, your victim registration has been approved.`,
      `Case ID: ${caseId}`,
      `OTP: ${otp}`,
      'Use your registered phone number, Case ID, and OTP to access the Victim Portal.',
      'OTP is valid for 15 minutes. Do not share it.',
    ].join('\n');

    const payload = { body: message, to: mobile };

    if (TWILIO_MESSAGING_SERVICE_SID) {
      payload.messagingServiceSid = TWILIO_MESSAGING_SERVICE_SID;
    } else {
      payload.from = TWILIO_PHONE_NUMBER;
    }

    const response = await client.messages.create(payload);
    console.log('[SMS] Sent successfully. SID:', response.sid);
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error('[SMS] Twilio API error:', {
      code: error.code,
      status: error.status,
      message: error.message,
      moreInfo: error.moreInfo,
    });
    const providerCode = error.code ? ` (code ${error.code})` : '';
    return { success: false, error: `Twilio SMS request failed${providerCode}: ${error.message}` };
  }
};

const sendLoginOtpSMS = async (phone, name, caseId, otp) => {
  const {
    TWILIO_PHONE_NUMBER,
    TWILIO_MESSAGING_SERVICE_SID,
  } = process.env;

  // Build client — detect credential mode automatically
  const { client, error: authError } = buildTwilioClient();
  if (authError) {
    console.error('[SMS] Auth error:', authError);
    return { success: false, error: authError };
  }

  if (!TWILIO_PHONE_NUMBER && !TWILIO_MESSAGING_SERVICE_SID) {
    return { success: false, error: 'Twilio sender configuration is incomplete (set TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID).' };
  }

  const mobile = normalizeIndianMobile(phone);
  if (!mobile) {
    return { success: false, error: 'Victim phone number is not a valid Indian mobile number.' };
  }

  try {
    const greeting = name ? `Dear ${name}, your` : 'Your';
    const message = [
      `AAROHAN: ${greeting} login OTP for Case ID: ${caseId} is ${otp}.`,
      'Valid for 15 minutes. Do not share this OTP with anyone.',
    ].join('\n');

    const payload = { body: message, to: mobile };

    if (TWILIO_MESSAGING_SERVICE_SID) {
      payload.messagingServiceSid = TWILIO_MESSAGING_SERVICE_SID;
    } else {
      payload.from = TWILIO_PHONE_NUMBER;
    }

    const response = await client.messages.create(payload);
    console.log('[SMS] Login OTP sent successfully. SID:', response.sid);
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error('[SMS] Twilio API error:', {
      code: error.code,
      status: error.status,
      message: error.message,
      moreInfo: error.moreInfo,
    });
    const providerCode = error.code ? ` (code ${error.code})` : '';
    return { success: false, error: `Twilio SMS request failed${providerCode}: ${error.message}` };
  }
};

module.exports = {
  sendApprovalSMS,
  sendLoginOtpSMS,
  normalizeIndianMobile,
};

