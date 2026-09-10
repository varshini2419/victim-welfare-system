const test = require('node:test');
const assert = require('node:assert/strict');
const DailyUpdate = require('../src/models/DailyUpdate');
const Alert = require('../src/models/Alert');

test('DailyUpdate preserves legacy feeling check-ins and supports optional content', async () => {
  assert.equal(DailyUpdate.schema.paths.feeling.isRequired, undefined);
  assert.equal(DailyUpdate.schema.paths.content.options.maxlength, 1000);
  assert.equal(await new DailyUpdate({ victimId: '507f1f77bcf86cd799439011', feeling: 'Okay' }).validate(), undefined);
  assert.equal(await new DailyUpdate({ victimId: '507f1f77bcf86cd799439011', content: 'A full daily update.' }).validate(), undefined);
  await assert.rejects(() => new DailyUpdate({ victimId: '507f1f77bcf86cd799439011' }).validate());
});

test('Alert supports counselor action resolution data', () => {
  assert.equal(Alert.schema.paths.actionTaken.options.maxlength, 2000);
});
