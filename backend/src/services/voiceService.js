const twilio = require('twilio');

const emergencyAlertMessage = `This is an emergency alert.

The victim assigned to you is currently in a potentially dangerous situation and has requested immediate emergency assistance.

Please treat this alert as extremely urgent.

Immediately contact the victim and check their current situation. If necessary, meet the victim directly and provide appropriate counseling, support, and assistance.

Please do not ignore this emergency request.

Immediate action is required.

Thank you.`;

const isConfiguredValue = (value) => {
	return Boolean(value && !String(value).startsWith('REPLACE_WITH_'));
};

const normalizePhone = (phone) => {
	const digits = String(phone || '').replace(/\D/g, '');
	if (digits.length === 10) return `+91${digits}`;
	if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
	if (digits.length > 10 && digits.startsWith('00')) return `+${digits.slice(2)}`;
	return null;
};

const getVoiceConfiguration = () => {
	const {
		TWILIO_VOICE_ACCOUNT_SID: accountSid,
		TWILIO_VOICE_API_KEY_SID: apiKeySid,
		TWILIO_VOICE_API_KEY_SECRET: apiKeySecret,
		TWILIO_VOICE_PHONE_NUMBER: fromNumber,
		TWILIO_ACCOUNT_SID: defaultAccountSid,
		TWILIO_PHONE_NUMBER: defaultFromNumber
	} = process.env;

	const effectiveAccountSid = isConfiguredValue(accountSid) ? accountSid : defaultAccountSid;
	const effectiveFromNumber = isConfiguredValue(fromNumber) ? fromNumber : defaultFromNumber;

	if (![effectiveAccountSid, apiKeySid, apiKeySecret, effectiveFromNumber].every(isConfiguredValue)) {
		return { configured: false };
	}

	return {
		configured: true,
		accountSid: effectiveAccountSid,
		apiKeySid,
		apiKeySecret,
		fromNumber: effectiveFromNumber
	};
};

const initiateEmergencyCall = async (counselorPhone) => {
	const configuration = getVoiceConfiguration();
	if (!configuration.configured) {
		return { success: false, code: 'VOICE_NOT_CONFIGURED' };
	}

	const toNumber = normalizePhone(counselorPhone);
	if (!toNumber) {
		return { success: false, code: 'INVALID_COUNSELOR_PHONE' };
	}

	try {
		const client = twilio(configuration.apiKeySid, configuration.apiKeySecret, {
			accountSid: configuration.accountSid
		});

		const call = await client.calls.create({
			to: toNumber,
			from: configuration.fromNumber,
			twiml: `<Response><Say voice="alice">${emergencyAlertMessage}</Say></Response>`
		});

		return { success: true, callSid: call.sid, status: call.status || 'initiated' };
	} catch (error) {
		console.error('[VOICE] Twilio call failed:', { code: error.code, status: error.status, message: error.message });
		return { success: false, code: 'VOICE_CALL_FAILED' };
	}
};

module.exports = { getVoiceConfiguration, initiateEmergencyCall, normalizePhone, emergencyAlertMessage };
