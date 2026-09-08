const test = require('node:test');
const assert = require('node:assert/strict');
const Case = require('../src/models/Case');

test('Case schema supports the approval and counselor-assignment metadata fields', () => {
  const paths = Object.keys(Case.schema.paths);
  assert.ok(paths.includes('assignedCounselorId'));
  assert.ok(paths.includes('assignedAt'));
  assert.ok(paths.includes('approvedAt'));
  assert.ok(paths.includes('approvedBy'));
});
