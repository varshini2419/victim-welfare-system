const DailyUpdate = require('../models/DailyUpdate');

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const getISTDayBoundaries = (reference = new Date()) => {
  const nowIST = new Date(new Date(reference).getTime() + IST_OFFSET_MS);
  const startOfDayIST = new Date(nowIST);
  startOfDayIST.setUTCHours(0, 0, 0, 0);
  const endOfDayIST = new Date(nowIST);
  endOfDayIST.setUTCHours(23, 59, 59, 999);

  return {
    todayStartUTC: new Date(startOfDayIST.getTime() - IST_OFFSET_MS),
    todayEndUTC: new Date(endOfDayIST.getTime() - IST_OFFSET_MS),
  };
};

const serviceError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const createDailyUpdate = async ({ victimId, content }) => {
  const { todayStartUTC, todayEndUTC } = getISTDayBoundaries();
  const existing = await DailyUpdate.findOne({
    victimId,
    content: { $exists: true, $nin: ['', null] },
    createdAt: { $gte: todayStartUTC, $lte: todayEndUTC },
  }).lean();

  if (existing) {
    throw serviceError(409, 'Today\'s Daily Update has already been submitted.');
  }

  return DailyUpdate.create({ victimId, content: content.trim() });
};

const listVictimUpdates = (victimId) => DailyUpdate.find({ victimId })
  .select('feeling content createdAt updatedAt')
  .sort({ createdAt: -1 })
  .lean();

const getTodayVictimUpdate = async (victimId) => {
  const { todayStartUTC, todayEndUTC } = getISTDayBoundaries();
  const update = await DailyUpdate.findOne({
    victimId,
    content: { $exists: true, $nin: ['', null] },
    createdAt: { $gte: todayStartUTC, $lte: todayEndUTC },
  })
    .select('content createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  return {
    submitted: Boolean(update),
    update,
    todayStartUTC,
    todayEndUTC,
  };
};

module.exports = {
  getISTDayBoundaries,
  createDailyUpdate,
  listVictimUpdates,
  getTodayVictimUpdate,
};
