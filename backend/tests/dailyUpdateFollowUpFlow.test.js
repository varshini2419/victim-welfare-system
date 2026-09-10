const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { generateToken } = require('../src/utils/jwt');
const User = require('../src/models/User');
const Victim = require('../src/models/Victim');
const Counselor = require('../src/models/Counselor');
const Case = require('../src/models/Case');
const Assignment = require('../src/models/Assignment');
const Alert = require('../src/models/Alert');
const CallLog = require('../src/models/CallLog');
const AuditLog = require('../src/models/AuditLog');

const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'test-secret-daily-follow-ups';

const request = (server, { method, path, token, body }) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : null;
  const req = http.request({
    hostname: '127.0.0.1',
    port: server.address().port,
    method,
    path,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
    },
  }, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => {
      let json = null;
      try { json = JSON.parse(responseBody); } catch { json = { raw: responseBody }; }
      resolve({ status: res.statusCode, json });
    });
  });
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

test('Daily Updates and Follow-Ups enforce ownership, aggregate events, and audit resolution', async (t) => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  const app = require('../src/app');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongoServer.stop();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const admin = await User.create({ email: 'daily-admin@example.com', passwordHash: 'hashed', role: 'admin', status: 'active', state: 'Maharashtra', district: 'Pune' });
  const victimUser = await User.create({ email: 'daily-victim@example.com', passwordHash: 'hashed', role: 'victim', status: 'active', state: 'Maharashtra', district: 'Pune' });
  const otherVictim = await User.create({ email: 'other-daily-victim@example.com', passwordHash: 'hashed', role: 'victim', status: 'active', state: 'Maharashtra', district: 'Pune' });
  const counselorUser = await User.create({ email: 'daily-counselor@example.com', passwordHash: 'hashed', role: 'counselor', status: 'active', state: 'Maharashtra', district: 'Pune' });
  const otherCounselorUser = await User.create({ email: 'other-daily-counselor@example.com', passwordHash: 'hashed', role: 'counselor', status: 'active', state: 'Maharashtra', district: 'Mumbai' });

  await Victim.create({ userId: victimUser._id, name: 'Daily Victim', state: 'Maharashtra', district: 'Pune', emergencyContacts: [{ name: 'Guardian', relationship: 'Parent', phone: '9999999999' }] });
  await Victim.create({ userId: otherVictim._id, name: 'Other Daily Victim', state: 'Maharashtra', district: 'Pune', emergencyContacts: [{ name: 'Guardian', relationship: 'Parent', phone: '9999999998' }] });

  const counselor = await Counselor.create({ userId: counselorUser._id, name: 'Daily Counselor', phone: '9876543210', state: 'Maharashtra', district: 'Pune', verificationStatus: 'approved' });
  await Counselor.create({ userId: otherCounselorUser._id, name: 'Other Counselor', phone: '9876543211', state: 'Maharashtra', district: 'Mumbai', verificationStatus: 'approved' });

  const victimCase = await Case.create({ victimId: victimUser._id, caseId: 'CASE-DAILY-001', category: 'Threat / Intimidation', status: 'assigned', assignedCounselorId: counselor._id, assignedAt: new Date() });
  await Assignment.create({ victimId: victimUser._id, counselorId: counselorUser._id, assignedBy: admin._id, status: 'active' });

  const victimToken = generateToken(victimUser._id.toString(), 'victim', victimUser.email);
  const otherVictimToken = generateToken(otherVictim._id.toString(), 'victim', otherVictim.email);
  const counselorToken = generateToken(counselorUser._id.toString(), 'counselor', counselorUser.email);
  const otherCounselorToken = generateToken(otherCounselorUser._id.toString(), 'counselor', otherCounselorUser.email);

  const createResponse = await request(server, { method: 'POST', path: '/api/v1/victim/daily-updates', token: victimToken, body: { content: 'Today I attended my appointment and felt supported.' } });
  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.json.data.content, 'Today I attended my appointment and felt supported.');

  const duplicateResponse = await request(server, { method: 'POST', path: '/api/v1/victim/daily-updates', token: victimToken, body: { content: 'Second update today.' } });
  assert.equal(duplicateResponse.status, 409);

  const todayResponse = await request(server, { method: 'GET', path: '/api/v1/victim/daily-updates/today', token: victimToken });
  assert.equal(todayResponse.status, 200);
  assert.equal(todayResponse.json.submitted, true);
  assert.equal(todayResponse.json.update.content, 'Today I attended my appointment and felt supported.');

  const otherHistory = await request(server, { method: 'GET', path: '/api/v1/victim/daily-updates', token: otherVictimToken });
  assert.equal(otherHistory.status, 200);
  assert.equal(otherHistory.json.data.length, 0);

  const alert = await Alert.create({ victimId: victimUser._id, caseId: victimCase._id, severity: 'CRITICAL', alertType: 'EMERGENCY_SOS', source: 'EMERGENCY_SOS', description: 'Emergency event' });
  const callLog = await CallLog.create({ victimId: victimUser._id, caseId: victimCase._id, counselorId: counselor._id, riskEventId: alert._id, riskScore: 95, riskLevel: 'CRITICAL', callType: 'AI_CRITICAL_RISK', callStatus: 'NO_ANSWER' });
  alert.callLogId = callLog._id;
  await alert.save();

  const followUp = await request(server, { method: 'GET', path: `/api/v1/counselor/follow-ups/${victimUser._id}`, token: counselorToken });
  assert.equal(followUp.status, 200);
  assert.equal(followUp.json.data.dailyUpdates.length, 1);
  assert.equal(followUp.json.data.alerts[0].callLogId.callStatus, 'NO_ANSWER');
  assert.equal(JSON.stringify(followUp.json).includes('ChatMessage'), false);

  const unauthorizedFollowUp = await request(server, { method: 'GET', path: `/api/v1/counselor/follow-ups/${victimUser._id}`, token: otherCounselorToken });
  assert.equal(unauthorizedFollowUp.status, 403);

  const statusResponse = await request(server, { method: 'PATCH', path: `/api/v1/counselor/follow-ups/alerts/${alert._id}/status`, token: counselorToken, body: { status: 'ACKNOWLEDGED' } });
  assert.equal(statusResponse.status, 200);
  const inProgressResponse = await request(server, { method: 'PATCH', path: `/api/v1/counselor/follow-ups/alerts/${alert._id}/status`, token: counselorToken, body: { status: 'IN_PROGRESS' } });
  assert.equal(inProgressResponse.status, 200);
  const resolveResponse = await request(server, { method: 'PATCH', path: `/api/v1/counselor/follow-ups/alerts/${alert._id}/resolve`, token: counselorToken, body: { actionTaken: 'Called the victim and arranged a follow-up consultation.' } });
  assert.equal(resolveResponse.status, 200);
  assert.equal(resolveResponse.json.data.status, 'RESOLVED');
  assert.equal(resolveResponse.json.data.resolvedBy, counselorUser._id.toString());
  assert.equal(await AuditLog.countDocuments({ action: 'FOLLOW_UP_RESOLVED', targetId: alert._id }), 1);
});
