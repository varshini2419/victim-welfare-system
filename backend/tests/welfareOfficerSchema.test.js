const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/User');
const WelfareStaff = require('../src/models/WelfareStaff');
const Case = require('../src/models/Case');

const validUser = {
  email: 'officer@example.com',
  passwordHash: 'hashed-password',
  role: 'WELFARE_OFFICER',
  status: 'active'
};

const validStaff = {
  userId: '507f1f77bcf86cd799439011',
  name: 'Welfare Officer',
  officerId: 'WO-001',
  phone: '9876543210',
  state: 'Andhra Pradesh',
  district: 'West Godavari',
  officerType: 'WELFARE_OFFICER',
  specializations: ['Rehabilitation'],
  category: 'Rehabilitation Support'
};

test('User schema accepts the single WELFARE_OFFICER role', () => {
  const error = new User(validUser).validateSync();
  assert.equal(error, undefined);
});

test('WelfareStaff schema requires the officer management fields', () => {
  const paths = WelfareStaff.schema.paths;
  for (const field of ['officerId', 'phone', 'state', 'district', 'officerType', 'specializations']) {
    assert.equal(paths[field].isRequired, true, `${field} should be required`);
  }
  assert.equal(new WelfareStaff(validStaff).validateSync(), undefined);
});

test('Case keeps the existing welfare officer assignment reference', () => {
  assert.ok(Case.schema.paths.assignedOfficer);
  assert.equal(Case.schema.paths.assignedOfficer.options.ref, 'User');
});
