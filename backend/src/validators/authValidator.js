const { body, validationResult } = require('express-validator');
const { ANDHRA_PRADESH_DISTRICTS } = require('../constants/districts');

const normalizePhoneForValidation = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.length === 10 ? digits : phone;
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  next();
};

const registerVictimValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').matches(/^\d{10}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('state').notEmpty().withMessage('State is required'),
  body('district').notEmpty().withMessage('District is required').custom((value) => {
    if (!ANDHRA_PRADESH_DISTRICTS.includes(value)) {
      throw new Error('District must be a valid Andhra Pradesh district');
    }
    return true;
  }),
  body('dob').notEmpty().withMessage('Date of Birth is required').isISO8601().withMessage('Invalid Date of Birth format'),
  body('gender').isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Invalid gender'),
  body('socialCategory').isIn(['SC', 'ST', 'OBC', 'EWS', 'General', 'Other', 'Prefer not to say']).withMessage('Invalid social category'),
  body('profession').notEmpty().withMessage('Profession is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('pinCode').optional({ checkFalsy: true }).matches(/^\d{6}$/).withMessage('PIN Code must be exactly 6 digits'),
  body('category').notEmpty().withMessage('Case category is required'),
  body('description').notEmpty().withMessage('Case description is required'),
  body('aadhaar').optional({ checkFalsy: true }).matches(/^\d{12}$/).withMessage('Aadhaar number must contain exactly 12 digits'),
  body('pan').optional({ checkFalsy: true }).matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i).withMessage('Enter a valid PAN number'),
  body('emergencyContacts').optional({ checkFalsy: true }).custom((value) => {
    try {
      const contacts = JSON.parse(value);
      if (!Array.isArray(contacts)) throw new Error();
      contacts.forEach(c => {
        if (!c.name || !c.relationship || !c.phone) throw new Error('Missing emergency contact fields');
        if (!/^\d{10}$/.test(c.phone)) throw new Error('Emergency phone must be a 10-digit number');
      });
      return true;
    } catch (e) {
      throw new Error(e.message === 'Emergency phone must be a 10-digit number' ? e.message : 'Invalid emergency contacts format');
    }
  }),
  body('firDetails').optional({ checkFalsy: true }).custom((value) => {
    try {
      const fir = JSON.parse(value);
      if (fir.isFiled && (!fir.firNumber || !fir.policeStation)) {
        throw new Error('FIR Number and Police Station are required if FIR is filed');
      }
      // Validate FIR district if provided
      if (fir.firDistrict && typeof fir.firDistrict !== 'string') {
        throw new Error('FIR District must be a string');
      }
      if (fir.firDistrict && !ANDHRA_PRADESH_DISTRICTS.includes(fir.firDistrict)) {
        throw new Error('FIR District must be a valid Andhra Pradesh district');
      }
      return true;
    } catch (e) {
      if (e.message === 'FIR Number and Police Station are required if FIR is filed' ||
          e.message === 'FIR District must be a string' ||
          e.message === 'FIR District must be a valid Andhra Pradesh district') {
        throw new Error(e.message);
      }
      throw new Error('Invalid FIR details format');
    }
  }),
  body('consentToProcess').custom((value) => {
    if (value !== 'true' && value !== true) {
      throw new Error('Consent is required to submit the registration');
    }
    return true;
  }),
  validateRequest
];

const registerCounselorValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('qualifications').isArray().withMessage('Qualifications must be an array of strings'),
  validateRequest
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

const victimLoginValidation = [
  body('caseId').notEmpty().withMessage('Case ID is required'),
  body('phone').customSanitizer(normalizePhoneForValidation).matches(/^\d{10}$/).withMessage('Enter a valid 10-digit phone number'),
  body('otp').matches(/^\d{6}$/).withMessage('OTP must be a 6-digit number'),
  validateRequest
];

const victimResendOtpValidation = [
  body('caseId').notEmpty().withMessage('Case ID is required'),
  body('phone').customSanitizer(normalizePhoneForValidation).matches(/^\d{10}$/).withMessage('Enter a valid 10-digit phone number'),
  validateRequest
];

module.exports = {
  registerVictimValidation,
  registerCounselorValidation,
  loginValidation,
  victimLoginValidation,
  victimResendOtpValidation
};
