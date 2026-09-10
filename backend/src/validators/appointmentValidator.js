const { body, param, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400);
		throw new Error(errors.array()[0].msg);
	}
	next();
};

const appointmentTypes = ['Initial Consultation', 'Follow-up', 'Individual Counseling', 'Other'];

const futureScheduledAt = (value) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) throw new Error('Invalid appointment date and time');
	if (date <= new Date()) throw new Error('Appointment must be scheduled in the future');
	return true;
};

const appointmentFields = [
	body('appointmentType')
		.isString().withMessage('Appointment type is required')
		.trim()
		.isIn(appointmentTypes).withMessage('Invalid appointment type'),
	body('reason')
		.isString().withMessage('Appointment reason is required')
		.trim()
		.notEmpty().withMessage('Appointment reason is required')
		.isLength({ max: 2000 }).withMessage('Appointment reason cannot exceed 2000 characters'),
	body('scheduledAt')
		.isISO8601().withMessage('Appointment date and time must be ISO-8601')
		.custom(futureScheduledAt),
];

const createVictimAppointment = [...appointmentFields, validateRequest];

const createCounselorAppointment = [
	body('victimId').isMongoId().withMessage('Invalid victim ID'),
	...appointmentFields,
	validateRequest,
];

const approveAppointment = [
	body('scheduledAt').optional().isISO8601().withMessage('Appointment date and time must be ISO-8601').custom(futureScheduledAt),
	validateRequest,
];

const rejectAppointment = [
	body('rejectionReason').optional().isString().trim().isLength({ max: 1000 }).withMessage('Rejection reason cannot exceed 1000 characters'),
	validateRequest,
];

const notesAppointment = [
	body('consultationNotes')
		.isString().withMessage('Consultation notes are required')
		.trim()
		.notEmpty().withMessage('Consultation notes are required')
		.isLength({ max: 5000 }).withMessage('Consultation notes cannot exceed 5000 characters'),
	validateRequest,
];

const appointmentId = [
	param('id').isMongoId().withMessage('Invalid appointment ID'),
	validateRequest,
];

module.exports = {
	createVictimAppointment,
	createCounselorAppointment,
	approveAppointment,
	rejectAppointment,
	notesAppointment,
	appointmentId,
};
