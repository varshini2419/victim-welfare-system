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
const { normalizeObjectId } = require('../src/controllers/counselorController');

const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'test-secret-assigned-case';

const request = (server, { method, path, token }) => new Promise((resolve, reject) => {
  const req = http.request({
    hostname: '127.0.0.1',
    port: server.address().port,
    method,
    path,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      let json = null;
      try {
        json = JSON.parse(body);
      } catch {
        json = { raw: body };
      }
      resolve({ status: res.statusCode, json });
    });
  });
  req.on('error', reject);
  req.end();
});

test('normalizeObjectId canonicalizes ObjectId, doc object, and populated counselordoc shapes', () => {
  const oid = new mongoose.Types.ObjectId();
  const docOid = new mongoose.Types.ObjectId();

  assert.equal(normalizeObjectId(oid), oid.toString());
  assert.equal(normalizeObjectId({ _id: docOid }), docOid.toString());

  const counselorDoc = {
    _id: docOid,
    name: 'Owner Counselor',
    role: 'counselor'
  };

  assert.equal(normalizeObjectId(counselorDoc), docOid.toString());
});

test('GET /api/v1/counselor/assigned-cases/:id returns victim profile for owner and 403 for another counselor', async (t) => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const app = require('../src/app');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongoServer.stop();
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  const victimUser = await User.create({
    email: 'victim-case-report@example.com',
    passwordHash: 'hashed',
    role: 'victim',
    status: 'active',
    state: 'Maharashtra',
    district: 'Pune',
    registrationId: 'REG-TEST-001'
  });

  const ownerUser = await User.create({
    email: 'owner-counselor@example.com',
    passwordHash: 'hashed',
    role: 'counselor',
    status: 'active',
    state: 'Maharashtra',
    district: 'Pune'
  });

  const otherUser = await User.create({
    email: 'other-counselor@example.com',
    passwordHash: 'hashed',
    role: 'counselor',
    status: 'active',
    state: 'Maharashtra',
    district: 'Mumbai'
  });

  const victim = await Victim.create({
    userId: victimUser._id,
    name: 'Test Victim',
    phone: '9876543210',
    gender: 'Female',
    profession: 'Teacher',
    address: '123 Test Street',
    emergencyContacts: [{ name: 'Guardian', relationship: 'Parent', phone: '9999999999' }]
  });

  const ownerCounselor = await Counselor.create({
    userId: ownerUser._id,
    name: 'Owner Counselor',
    phone: '1111111111',
    verificationStatus: 'approved',
    maxCaseload: 10,
    currentCaseload: 1,
    district: 'Pune',
    state: 'Maharashtra'
  });

  await Counselor.create({
    userId: otherUser._id,
    name: 'Other Counselor',
    phone: '2222222222',
    verificationStatus: 'approved',
    maxCaseload: 10,
    currentCaseload: 0,
    district: 'Mumbai',
    state: 'Maharashtra'
  });

  const assignedCase = await Case.create({
    caseId: 'CASE-TEST-001',
    victimId: victimUser._id,
    category: 'Threat / Intimidation',
    description: 'Need counseling support',
    status: 'assigned',
    assignedCounselorId: ownerCounselor._id,
    assignedAt: new Date(),
    supportRequired: ['Counseling'],
    firDetails: {
      isFiled: true,
      firNumber: 'FIR-1',
      policeStation: 'Test PS',
      district: 'Pune',
      state: 'Maharashtra'
    }
  });

  const ownerToken = generateToken(ownerUser._id.toString(), 'counselor', ownerUser.email);
  const otherToken = generateToken(otherUser._id.toString(), 'counselor', otherUser.email);

  const ownerResponse = await request(server, {
    method: 'GET',
    path: `/api/v1/counselor/assigned-cases/${assignedCase._id}`,
    token: ownerToken
  });

  assert.equal(ownerResponse.status, 200);
  assert.equal(ownerResponse.json.success, true);
  assert.equal(ownerResponse.json.data.case.caseId, 'CASE-TEST-001');
  assert.equal(ownerResponse.json.data.victim.name, victim.name);
  assert.equal(ownerResponse.json.data.victim.email, victimUser.email);
  assert.equal(ownerResponse.json.data.victim.phone, '9876543210');
  assert.equal(ownerResponse.json.data.victim.state, 'Maharashtra');

  const otherResponse = await request(server, {
    method: 'GET',
    path: `/api/v1/counselor/assigned-cases/${assignedCase._id}`,
    token: otherToken
  });

  assert.equal(otherResponse.status, 403);

  const listResponse = await request(server, {
    method: 'GET',
    path: '/api/v1/counselor/assigned-cases',
    token: ownerToken
  });

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.json.count, 1);

  const invalidResponse = await request(server, {
    method: 'GET',
    path: '/api/v1/counselor/assigned-cases/6a03b5afc3574dd59d26',
    token: ownerToken
  });

  assert.equal(invalidResponse.status, 404);
  assert.notEqual(invalidResponse.status, 500);
});
