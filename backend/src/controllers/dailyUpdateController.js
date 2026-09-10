const asyncHandler = require('express-async-handler');
const dailyUpdateService = require('../services/dailyUpdateService');

const handler = (callback) => asyncHandler(async (req, res) => {
  try {
    await callback(req, res);
  } catch (error) {
    if (error.status) res.status(error.status);
    throw error;
  }
});

const createDailyUpdate = handler(async (req, res) => {
  const update = await dailyUpdateService.createDailyUpdate({
    victimId: req.user._id,
    content: req.body.content,
  });
  res.status(201).json({ success: true, data: update, message: 'Daily update saved successfully.' });
});

const getMyDailyUpdates = handler(async (req, res) => {
  const updates = await dailyUpdateService.listVictimUpdates(req.user._id);
  res.json({ success: true, data: updates });
});

const getMyTodayDailyUpdate = handler(async (req, res) => {
  const result = await dailyUpdateService.getTodayVictimUpdate(req.user._id);
  res.json({ success: true, ...result });
});

module.exports = {
  createDailyUpdate,
  getMyDailyUpdates,
  getMyTodayDailyUpdate,
};
