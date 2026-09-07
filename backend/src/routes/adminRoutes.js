const express = require('express');
const router = express.Router();
const { 
  getPendingCounselors, 
  verifyCounselor, 
  assignCounselor 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/counselors/pending', getPendingCounselors);
router.post('/counselors/:id/verify', verifyCounselor);
router.post('/assignments', assignCounselor);

module.exports = router;
