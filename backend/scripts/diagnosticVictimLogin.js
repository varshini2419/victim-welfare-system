require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Victim = require('../src/models/Victim');
const Case = require('../src/models/Case');

const maskPhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 4) return 'masked:' + digits;
  return 'masked:' + digits.slice(-4) + ' raw:' + String(phone);
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const cases = await Case.find({ status: { $in: ['open', 'in-progress', 'resolved'] } })
      .populate('victimId', '_id status email role')
      .select('caseId victimId status approvedAt assignedAt')
      .lean();

    console.log('CASE_COUNT', cases.length);

    for (const c of cases) {
      const victim = await Victim.findOne({ userId: c.victimId && c.victimId._id })
        .select('_id userId name phone')
        .lean();

      console.log(JSON.stringify({
        caseId: c.caseId,
        caseStatus: c.status,
        caseVictimId: c.victimId && c.victimId._id,
        userStatus: c.victimId && c.victimId.status,
        victimPhone: maskPhone(victim && victim.phone),
        victimName: victim && victim.name,
        victimUserId: victim && victim.userId,
        victimId: victim && victim._id
      }));
    }

    await mongoose.disconnect();
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
})();
