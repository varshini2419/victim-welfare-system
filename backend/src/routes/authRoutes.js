const express = require('express');
const router = express.Router();
const { 
  registerVictim, 
  registerCounselor, 
  login, 
  loginVictim,
  resendVictimOtp,
  getMe,
  getRegistrationStatus
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { 
  registerVictimValidation, 
  registerCounselorValidation, 
  loginValidation,
  victimLoginValidation,
  victimResendOtpValidation
} = require('../validators/authValidator');

const { uploadVictimRegistration } = require('../middleware/uploadMiddleware');
const { authLimiter, otpLimiter, otpResendLimiter } = require('../middleware/rateLimitMiddleware');

router.post(
  '/register/victim',
  uploadVictimRegistration,
  registerVictimValidation,
  registerVictim
);
router.post('/register/counselor', registerCounselorValidation, registerCounselor);
router.post('/login', loginValidation, login);
router.post('/login/victim', victimLoginValidation, loginVictim);
router.post('/login/victim/send-otp', otpLimiter, victimResendOtpValidation, resendVictimOtp);
router.post('/login/victim/resend-otp', otpResendLimiter, victimResendOtpValidation, resendVictimOtp);
router.get('/me', protect, getMe);

// Public registration tracking — rate-limited to prevent enumeration
router.get('/registration-status/:registrationId', authLimiter, getRegistrationStatus);

module.exports = router;