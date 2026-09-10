const test = require('node:test');
const assert = require('node:assert/strict');
const CallLog = require('../src/models/CallLog');
const {
  normalizeRiskLevel,
  hasDangerSignal,
  isEscalationEligible,
} = require('../src/services/riskEventService');

test('risk policy maps existing distress bands and escalates high and critical levels', () => {
  assert.equal(normalizeRiskLevel({ distress_score: 20 }), 'LOW');
  assert.equal(normalizeRiskLevel({ distress_score: 40 }), 'MEDIUM');
  assert.equal(normalizeRiskLevel({ distress_score: 60 }), 'HIGH');
  assert.equal(normalizeRiskLevel({ distress_score: 80 }), 'CRITICAL');
  assert.equal(isEscalationEligible({ distress_score: 60, crisis_flag: false }), true);
  assert.equal(isEscalationEligible({ distress_score: 80, crisis_flag: false }), true);
});

test('risk policy escalates high and critical levels regardless of danger signals', () => {
  assert.equal(hasDangerSignal({ crisis_flag: true }), true);
  assert.equal(isEscalationEligible({ distress_score: 60, crisis_flag: false }), true);
  assert.equal(isEscalationEligible({ distress_score: 80, crisis_flag: false }), true);
  assert.equal(isEscalationEligible({ riskLevel: 'CRITICAL', dangerLevel: 'LOW' }), true);
  assert.equal(isEscalationEligible({ riskLevel: 'HIGH', dangerLevel: 'LOW' }), true);
});

test('call log requires a risk event and protects supported statuses', () => {
  const paths = CallLog.schema.paths;
  assert.equal(paths.riskEventId.options.required, true);
  assert.deepEqual(paths.callStatus.enumValues, ['PENDING', 'INITIATED', 'COMPLETED', 'FAILED', 'NO_ANSWER']);
  assert.equal(CallLog.schema.indexes().some(([fields, options]) => fields.riskEventId === 1 && fields.counselorId === 1 && options.unique), true);
});
