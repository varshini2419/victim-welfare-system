const twilio = require('twilio');

const teluguEmergencyMessage = 'ఇది అత్యవసర సమాచారం. మీకు కేటాయించబడిన బాధితుడు ప్రస్తుతం ప్రమాదకరమైన పరిస్థితిలో ఉన్నారు. వారు తీవ్రమైన మానసిక ఒత్తిడిలో ఉన్నట్లు అత్యవసర సహాయం కోరారు. దయచేసి ఈ విషయాన్ని అత్యంత అత్యవసరంగా పరిగణించండి. వెంటనే బాధితుడిని సంప్రదించి, వారి పరిస్థితిని తెలుసుకోండి. అవసరమైతే వారిని ప్రత్యక్షంగా కలుసుకుని, తగిన కౌన్సెలింగ్ మరియు సహాయాన్ని అందించండి. దయచేసి ఈ అత్యవసర అభ్యర్థనను నిర్లక్ష్యం చేయవద్దు. ధన్యవాదాలు.';

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
		TWILIO_VOICE_AUTH_TOKEN: authToken,
		TWILIO_VOICE_API_KEY_SID: apiKeySid,
		TWILIO_VOICE_API_KEY_SECRET: apiKeySecret,
		TWILIO_VOICE_PHONE_NUMBER: fromNumber,
		TWILIO_ACCOUNT_SID: defaultAccountSid,
		TWILIO_AUTH_TOKEN: defaultAuthToken,
		TWILIO_PHONE_NUMBER: defaultFromNumber
	} = process.env;

	const effectiveAccountSid = accountSid || defaultAccountSid;
	const effectiveFromNumber = fromNumber || defaultFromNumber;

	if (!effectiveAccountSid || !effectiveFromNumber) {
		return { configured: false };
	}

	if (apiKeySid && apiKeySecret && !apiKeySid.startsWith('REPLACE_WITH_') && !apiKeySecret.startsWith('REPLACE_WITH_')) {
		return { configured: true, mode: 'apiKey', accountSid: effectiveAccountSid, apiKeySid, apiKeySecret, fromNumber: effectiveFromNumber };
	}

	const effectiveAuthToken = (authToken && !authToken.startsWith('REPLACE_WITH_') && authToken !== 'ab4a0324d2728839f8ef13e9dd4c45aa') ? authToken : defaultAuthToken;

	if (effectiveAuthToken) {
		return { configured: true, mode: 'authToken', accountSid: effectiveAccountSid, authToken: effectiveAuthToken, fromNumber: effectiveFromNumber };
	}

	return { configured: false };
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
		const client = configuration.mode === 'apiKey'
			? twilio(configuration.apiKeySid, configuration.apiKeySecret, {
				accountSid: configuration.accountSid
			})
			: twilio(configuration.accountSid, configuration.authToken);

		const call = await client.calls.create({
			to: toNumber,
			from: configuration.fromNumber,
			twiml: `<Response><Say language="te-IN">${teluguEmergencyMessage}</Say></Response>`
		});

		return { success: true, callSid: call.sid, status: call.status || 'initiated' };
	} catch (error) {
		console.error('[VOICE] Twilio call failed:', { code: error.code, status: error.status, message: error.message });
		return { success: false, code: 'VOICE_CALL_FAILED' };
	}
};

module.exports = { getVoiceConfiguration, initiateEmergencyCall, normalizePhone };
