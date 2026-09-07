const express = require('express');
const router = express.Router();
const { 
  registerVictim, 
  registerCounselor, 
  login, 
  getMe 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { 
  registerVictimValidation, 
  registerCounselorValidation, 
  loginValidation 
} = require('../validators/authValidator');

router.post('/register/victim', registerVictimValidation, registerVictim);
router.post('/register/counselor', registerCounselorValidation, registerCounselor);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

module.exports = router;
