const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const database = require('../src/config/database');

const originalEnvironment = {
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
  USE_MEMORY_DB: process.env.USE_MEMORY_DB,
};

test.afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('validateMongoUri requires a persistent URI with an explicit database name', () => {
  assert.throws(
    () => database.validateMongoUri(undefined),
    database.DatabaseConfigurationError
  );
  assert.throws(
    () => database.validateMongoUri('mongodb://localhost:27017'),
    database.DatabaseConfigurationError
  );
  assert.throws(
    () => database.validateMongoUri('https://localhost:27017/aarohan'),
    database.DatabaseConfigurationError
  );

  assert.deepEqual(
    database.validateMongoUri('mongodb://localhost:27017/aarohan?retryWrites=true'),
    {
      uri: 'mongodb://localhost:27017/aarohan?retryWrites=true',
      databaseName: 'aarohan',
      target: 'mongodb://localhost:27017/aarohan',
    }
  );
});

test('USE_MEMORY_DB is rejected outside the test environment', async () => {
  process.env.NODE_ENV = 'development';
  process.env.USE_MEMORY_DB = 'true';

  await assert.rejects(
    database.connectDB(),
    (error) => error instanceof database.DatabaseConfigurationError
      && error.message.includes('test-only')
  );
});

test('persistent connection errors are surfaced instead of falling back to memory', async () => {
  process.env.NODE_ENV = 'development';
  process.env.USE_MEMORY_DB = 'false';
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27018/aarohan';

  const originalConnect = mongoose.connect;
  let connectCalls = 0;
  mongoose.connect = async () => {
    connectCalls += 1;
    throw new Error('simulated persistent database outage');
  };

  try {
    await assert.rejects(
      database.connectDB(),
      (error) => error instanceof database.DatabaseConnectionError
        && error.message.includes('persistent MongoDB')
    );
    assert.equal(connectCalls, 1);
  } finally {
    mongoose.connect = originalConnect;
  }
});
