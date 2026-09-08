require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Counselor = require('../src/models/Counselor');
const Case = require('../src/models/Case');

const call = (token, path) => new Promise((resolve, reject) => {
  const req = http.request({
    hostname: '127.0.0.1',
    port: 5000,
    path,
    headers: { Authorization: `Bearer ${token}` }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      let json = {};
      try {
        json = JSON.parse(body);
      } catch {
        json = { raw: body };
      }
      resolve({
        status: res.statusCode,
        hasVictimName: Boolean(json?.data?.victim?.name),
        dataKeys: json?.data ? Object.keys(json.data) : [],
        caseId: json?.data?.case?.caseId || null
      });
    });
  });
  req.on('error', reject);
  req.end();
});

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const assigned = await Case.findOne({ assignedCounselorId: { $ne: null } });
  if (!assigned) {
    console.log(JSON.stringify({ ok: false, reason: 'no-assigned-case' }));
    await mongoose.disconnect();
    return;
  }

  const ownerCounselor = await Counselor.findById(assigned.assignedCounselorId);
  const ownerUser = await User.findById(ownerCounselor.userId);
  const otherCounselor = await Counselor.findOne({ _id: { $ne: ownerCounselor._id } });

  const ownerToken = jwt.sign(
    { userId: ownerUser._id.toString(), email: ownerUser.email, role: 'counselor' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const result = {
    caseMongoId: String(assigned._id),
    owner: await call(ownerToken, assigned._id)
  };

  if (otherCounselor) {
    const otherUser = await User.findById(otherCounselor.userId);
    const otherToken = jwt.sign(
      { userId: otherUser._id.toString(), email: otherUser.email, role: 'counselor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    result.other = await call(otherToken, assigned._id);
  } else {
    result.other = 'no-second-counselor-in-db';
  }

  console.log(JSON.stringify(result));
  await mongoose.disconnect();
})().catch(async (error) => {
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
