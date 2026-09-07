const { body, validationResult, param } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  next();
};

const validateSessionId = [
  param('id').isMongoId().withMessage('Invalid session ID format'),
  validateRequest
];

const validateMessage = [
  param('id').isMongoId().withMessage('Invalid session ID format'),
  body('content')
    .isString().withMessage('Message must be a string')
    .trim()
    .notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  validateRequest
];

module.exports = {
  validateSessionId,
  validateMessage
};
