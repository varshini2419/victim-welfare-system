const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getVictims,
  getVictimDetails,
  getCounselors,
  getCounselorById,
  createCounselor,
  updateCounselor,
  deleteCounselor,
  getPendingCounselors,
  verifyCounselor,
  assignCounselor,
  getRequests,
  getRequestById,
  getActiveCounselors,
  assignCounselorToRequest
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload, uploadDocuments } = require('../middleware/uploadMiddleware');

const { uploadCaseDocuments, approveCase, resendCaseOtp, rejectCase, streamAdminDocument } = require('../controllers/adminCaseController');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/victims', getVictims);
router.get('/victims/:id', getVictimDetails);

// Request management aliases that map to the repository’s existing case/request architecture
router.get('/requests', getRequests);
router.get('/requests/:id', getRequestById);
router.get('/counselors/active', getActiveCounselors);
router.put('/requests/:id/assign-counselor', assignCounselorToRequest);

// Counselor management routes
router.get('/counselors', getCounselors);
router.post('/counselors', upload.single('profileImage'), createCounselor);
router.get('/counselors/pending', getPendingCounselors);
router.get('/counselors/:id', getCounselorById);
router.put('/counselors/:id', upload.single('profileImage'), updateCounselor);
router.delete('/counselors/:id', deleteCounselor);
router.post('/counselors/:id/verify', verifyCounselor);
router.post('/assignments', assignCounselor);

// Case management routes

router.post('/cases/:id/documents', uploadDocuments.array('documents', 5), uploadCaseDocuments);
router.post('/cases/:id/approve', approveCase);
router.post('/cases/:id/resend-otp', resendCaseOtp);
router.post('/cases/:id/reject', rejectCase);
router.get('/documents/:filename', streamAdminDocument);

// Alert management routes
const { getAlerts, acknowledgeAlert, resolveAlert } = require('../controllers/adminAlertController');
router.get('/alerts', getAlerts);
router.patch('/alerts/:id/acknowledge', acknowledgeAlert);
router.patch('/alerts/:id/resolve', resolveAlert);

// Reports routes
const { getGeographicReports } = require('../controllers/adminReportsController');
router.get('/reports/geographic', getGeographicReports);

module.exports = router;
