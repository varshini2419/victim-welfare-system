const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  next();
};

const validateDailyUpdateContent = [
  body('content')
    .isString().withMessage('Daily update content is required')
    .trim()
    .notEmpty().withMessage('Daily update content cannot be empty')
    .isLength({ max: 1000 }).withMessage('Daily update content cannot exceed 1000 characters'),
  validateRequest,
];

const validateAlertStatus = [
  body('status')
    .isIn(['ACKNOWLEDGED', 'IN_PROGRESS']).withMessage('Invalid follow-up status'),
  validateRequest,
];

const validateAlertResolution = [
  body('actionTaken')
    .isString().withMessage('Action taken is required')
    .trim()
    .notEmpty().withMessage('Action taken is required')
    .isLength({ max: 2000 }).withMessage('Action taken cannot exceed 2000 characters'),
  validateRequest,
];

module.exports = {
  validateDailyUpdateContent,
  validateAlertStatus,
  validateAlertResolution,
};