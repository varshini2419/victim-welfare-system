const test = require('node:test');
const assert = require('node:assert/strict');
const Appointment = require('../src/models/Appointment');

test('Appointment schema defines the required workflow fields and lifecycle', () => {
  const paths = Appointment.schema.paths;
  for (const field of ['victimId', 'caseId', 'counselorId', 'createdBy', 'appointmentType', 'reason', 'scheduledAt']) {
    assert.equal(paths[field].isRequired, true, `${field} should be required`);
  }
  assert.deepEqual(paths.status.enumValues, ['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED']);
  assert.ok(Appointment.schema.indexes().some(([fields]) => fields.victimId === 1 && fields.status === 1 && fields.scheduledAt === 1));
  assert.ok(Appointment.schema.indexes().some(([fields]) => fields.counselorId === 1 && fields.status === 1 && fields.scheduledAt === 1));
});
