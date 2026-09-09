const asyncHandler = require('express-async-handler');
const Case = require('../models/Case');
const Counselor = require('../models/Counselor');
const Alert = require('../models/Alert');
const { initiateEmergencyCall } = require('../services/voiceService');

const requestEmergencyHelp = asyncHandler(async (req, res) => {
	const victimCase = await Case.findOne({
		victimId: req.user._id,
		status: { $in: ['open', 'in-progress', 'assigned', 'resolved'] }
	});

	if (!victimCase) {
		res.status(404);
		throw new Error('No active case is available for emergency assistance.');
	}

	if (!victimCase.assignedCounselorId) {
		res.status(409);
		throw new Error('No assigned counselor is currently available.');
	}

	const counselor = await Counselor.findById(victimCase.assignedCounselorId).select('phone');
	if (!counselor) {
		res.status(409);
		throw new Error('No assigned counselor is currently available.');
	}

	const alert = await Alert.create({
		caseId: victimCase._id,
		victimId: req.user._id,
		severity: 'CRITICAL',
		alertType: 'EMERGENCY_SOS',
		description: 'Victim requested immediate emergency assistance.'
	});

	const callResult = await initiateEmergencyCall(counselor.phone);
	if (!callResult.success) {
		res.status(callResult.code === 'VOICE_NOT_CONFIGURED' ? 503 : 502);
		throw new Error(callResult.code === 'VOICE_NOT_CONFIGURED'
			? 'Emergency calling service is not configured yet.'
			: 'Emergency calling could not be initiated.');
	}

	res.status(201).json({
		success: true,
		message: 'Emergency alert initiated. Your assigned counselor is being contacted.',
		data: { alertId: alert._id, status: callResult.status }
	});
});

module.exports = { requestEmergencyHelp };
