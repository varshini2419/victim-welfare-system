const asyncHandler = require('express-async-handler');
const followUpService = require('../services/followUpService');

const handler = (callback) => asyncHandler(async (req, res) => {
  try {
    await callback(req, res);
  } catch (error) {
    if (error.status) res.status(error.status);
    throw error;
  }
});

const getFollowUpVictims = handler(async (req, res) => {
  const victims = await followUpService.listAssignedVictims(req.user._id);
  res.json({ success: true, data: victims });
});

const getFollowUp = handler(async (req, res) => {
  const data = await followUpService.getFollowUp(req.user._id, req.params.victimId);
  res.json({ success: true, data });
});

const updateAlertStatus = handler(async (req, res) => {
  const alert = await followUpService.updateAlertStatus({
    counselorUserId: req.user._id,
    alertId: req.params.alertId,
    status: req.body.status,
  });
  res.json({ success: true, data: alert });
});

const resolveAlert = handler(async (req, res) => {
  const alert = await followUpService.resolveAlert({
    counselorUserId: req.user._id,
    alertId: req.params.alertId,
    actionTaken: req.body.actionTaken,
  });
  res.json({ success: true, data: alert, message: 'Follow-up resolved successfully.' });
});

module.exports = {
  getFollowUpVictims,
  getFollowUp,
  updateAlertStatus,
  resolveAlert,
};
