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
const Appointment = require('../src/models/Appointment');
const Notification = require('../src/models/Notification');

const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'test-secret-appointments';

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

const futureIso = (days, hour = 10) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

test('appointment requests, direct scheduling, authorization, conflicts, completion, and notifications', async (t) => {
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

  const admin = await User.create({ email: 'appointment-admin@example.com', passwordHash: 'hashed', role: 'admin', status: 'active', state: 'Maharashtra', district: 'Pune' });
  const victimUser = await User.create({ email: 'appointment-victim@example.com', passwordHash: 'hashed', role: 'victim', status: 'active', state: 'Maharashtra', district: 'Pune' });
  const otherVictimUser = await User.create({ email: 'other-appointment-victim@example.com', passwordHash: 'hashed', role: 'victim', status: 'active', state: 'Maharashtra', district: 'Pune' });
  const counselorUser = await User.create({ email: 'appointment-counselor@example.com', passwordHash: 'hashed', role: 'counselor', status: 'active', state: 'Maharashtra', district: 'Pune' });
  const otherCounselorUser = await User.create({ email: 'other-appointment-counselor@example.com', passwordHash: 'hashed', role: 'counselor', status: 'active', state: 'Maharashtra', district: 'Mumbai' });

  await Victim.create({ userId: victimUser._id, name: 'Appointment Victim', phone: '9876543210', gender: 'Female', profession: 'Teacher', address: 'Test address', emergencyContacts: [{ name: 'Guardian', relationship: 'Parent', phone: '9999999999' }] });
  await Victim.create({ userId: otherVictimUser._id, name: 'Other Victim', phone: '9876543211', gender: 'Female', profession: 'Teacher', address: 'Other address', emergencyContacts: [{ name: 'Guardian', relationship: 'Parent', phone: '9999999998' }] });

  const counselor = await Counselor.create({ userId: counselorUser._id, name: 'Assigned Counselor', phone: '9876543212', verificationStatus: 'approved', state: 'Maharashtra', district: 'Pune' });
  await Counselor.create({ userId: otherCounselorUser._id, name: 'Other Counselor', phone: '9876543213', verificationStatus: 'approved', state: 'Maharashtra', district: 'Mumbai' });

  const victimCase = await Case.create({ victimId: victimUser._id, caseId: 'CASE-APPOINTMENT-001', category: 'Threat / Intimidation', description: 'Appointment test case', status: 'assigned', assignedCounselorId: counselor._id, assignedAt: new Date(), supportRequired: ['Counseling'] });
  await Assignment.create({ victimId: victimUser._id, counselorId: counselorUser._id, assignedBy: admin._id, status: 'active' });

  const victimToken = generateToken(victimUser._id.toString(), 'victim', victimUser.email);
  const counselorToken = generateToken(counselorUser._id.toString(), 'counselor', counselorUser.email);
  const otherCounselorToken = generateToken(otherCounselorUser._id.toString(), 'counselor', otherCounselorUser.email);
  const otherVictimToken = generateToken(otherVictimUser._id.toString(), 'victim', otherVictimUser.email);

  const requestedAt = futureIso(2, 10);
  const requestResponse = await request(server, {
    method: 'POST',
    path: '/api/v1/victim/appointments',
    token: victimToken,
    body: { scheduledAt: requestedAt, appointmentType: 'Initial Consultation', reason: 'Discuss support options', counselorId: otherCounselorUser._id.toString() },
  });
  assert.equal(requestResponse.status, 201);
  assert.equal(requestResponse.json.data.status, 'PENDING');
  assert.equal(requestResponse.json.data.caseId.caseId, victimCase.caseId);
  assert.equal(requestResponse.json.data.victimId.name, 'Appointment Victim');
  assert.equal(requestResponse.json.data.counselor.name, 'Assigned Counselor');
  assert.equal(await Notification.countDocuments({ recipientId: counselorUser._id, type: 'appointment_request' }), 1);

  const otherPendingResponse = await request(server, { method: 'GET', path: '/api/v1/counselor/appointments/pending', token: otherCounselorToken });
  assert.equal(otherPendingResponse.status, 200);
  assert.equal(otherPendingResponse.json.data.length, 0);

  const approveResponse = await request(server, { method: 'PATCH', path: `/api/v1/counselor/appointments/${requestResponse.json.data._id}/approve`, token: counselorToken });
  assert.equal(approveResponse.status, 200);
  assert.equal(approveResponse.json.data.status, 'CONFIRMED');
  assert.equal(await Notification.countDocuments({ recipientId: victimUser._id, type: 'appointment_confirmed' }), 1);

  const victimAppointments = await request(server, { method: 'GET', path: '/api/v1/victim/appointments', token: victimToken });
  assert.equal(victimAppointments.status, 200);
  assert.equal(victimAppointments.json.data.some((item) => item.status === 'CONFIRMED'), true);
  assert.equal(JSON.stringify(victimAppointments.json).includes('ChatMessage'), false);

  const otherVictimRead = await request(server, { method: 'GET', path: `/api/v1/victim/appointments/${requestResponse.json.data._id}`, token: otherVictimToken });
  assert.equal(otherVictimRead.status, 404);

  const rejectedRequest = await request(server, {
    method: 'POST',
    path: '/api/v1/victim/appointments',
    token: victimToken,
    body: { scheduledAt: futureIso(3, 10), appointmentType: 'Follow-up', reason: 'Request to reject' },
  });
  assert.equal(rejectedRequest.status, 201);
  const rejectResponse = await request(server, {
    method: 'PATCH',
    path: `/api/v1/counselor/appointments/${rejectedRequest.json.data._id}/reject`,
    token: counselorToken,
    body: { rejectionReason: 'Please choose another available time.' },
  });
  assert.equal(rejectResponse.status, 200);
  assert.equal(rejectResponse.json.data.status, 'REJECTED');
  assert.equal(rejectResponse.json.data.rejectionReason, 'Please choose another available time.');
  const historyResponse = await request(server, { method: 'GET', path: '/api/v1/victim/appointments', token: victimToken });
  assert.equal(historyResponse.json.data.some((item) => item._id === rejectedRequest.json.data._id && item.status === 'REJECTED'), true);

  const conflictingResponse = await request(server, {
    method: 'POST',
    path: '/api/v1/counselor/appointments',
    token: counselorToken,
    body: { victimId: victimUser._id.toString(), scheduledAt: requestedAt, appointmentType: 'Follow-up', reason: 'Conflicting slot' },
  });
  assert.equal(conflictingResponse.status, 409);

  const unassignedResponse = await request(server, {
    method: 'POST',
    path: '/api/v1/counselor/appointments',
    token: counselorToken,
    body: { victimId: otherVictimUser._id.toString(), scheduledAt: futureIso(3, 11), appointmentType: 'Follow-up', reason: 'Unauthorized victim' },
  });
  assert.equal(unassignedResponse.status, 409);

  const directResponse = await request(server, {
    method: 'POST',
    path: '/api/v1/counselor/appointments',
    token: counselorToken,
    body: { victimId: victimUser._id.toString(), scheduledAt: futureIso(4, 11), appointmentType: 'Follow-up', reason: 'Directly scheduled follow-up' },
  });
  assert.equal(directResponse.status, 201);
  assert.equal(directResponse.json.data.status, 'CONFIRMED');
  assert.equal(await Notification.countDocuments({ recipientId: victimUser._id, type: 'appointment_scheduled' }), 1);

  const unauthorizedComplete = await request(server, { method: 'PATCH', path: `/api/v1/counselor/appointments/${directResponse.json.data._id}/complete`, token: otherCounselorToken });
  assert.equal(unauthorizedComplete.status, 403);

  const completeResponse = await request(server, { method: 'PATCH', path: `/api/v1/counselor/appointments/${directResponse.json.data._id}/complete`, token: counselorToken });
  assert.equal(completeResponse.status, 200);
  assert.equal(completeResponse.json.data.status, 'COMPLETED');

  const notesResponse = await request(server, {
    method: 'PATCH',
    path: `/api/v1/counselor/appointments/${directResponse.json.data._id}/notes`,
    token: counselorToken,
    body: { consultationNotes: 'Guidance provided and follow-up recommended.' },
  });
  assert.equal(notesResponse.status, 200);
  assert.equal(notesResponse.json.data.consultationNotes, 'Guidance provided and follow-up recommended.');

  const victimModifyNotes = await request(server, { method: 'PATCH', path: `/api/v1/counselor/appointments/${directResponse.json.data._id}/notes`, token: victimToken, body: { consultationNotes: 'Unauthorized' } });
  assert.equal(victimModifyNotes.status, 403);
});
