const asyncHandler = require('express-async-handler');
const Alert = require('../models/Alert');
const User = require('../models/User');

// Helper function to get scoped victim IDs for Alerts
const getScopedVictimIds = async (state) => {
  const users = await User.find({ role: 'victim', state }).select('_id');
  return users.map(u => u._id);
};

// @desc    Get alerts for state
// @route   GET /api/v1/admin/alerts
// @access  Private/Admin
const getAlerts = asyncHandler(async (req, res) => {
  const victimIds = await getScopedVictimIds(req.user.state);
  const alerts = await Alert.find({ victimId: { $in: victimIds } })
    .populate('victimId', 'email')
    .populate('caseId', 'caseId status')
    .sort({ severity: -1, createdAt: -1 });

  res.json({
    success: true,
    data: alerts
  });
});

// @desc    Acknowledge alert
// @route   PATCH /api/v1/admin/alerts/:id/acknowledge
// @access  Private/Admin
const acknowledgeAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  alert.status = 'ACKNOWLEDGED';
  alert.acknowledgedAt = Date.now();
  alert.acknowledgedBy = req.user._id;
  await alert.save();

  res.json({ success: true, data: alert });
});

// @desc    Resolve alert
// @route   PATCH /api/v1/admin/alerts/:id/resolve
// @access  Private/Admin
const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error('Alert not found');
  }

  alert.status = 'RESOLVED';
  alert.resolvedAt = Date.now();
  alert.resolvedBy = req.user._id;
  await alert.save();

  res.json({ success: true, data: alert });
});

module.exports = {
  getAlerts,
  acknowledgeAlert,
  resolveAlert
};
