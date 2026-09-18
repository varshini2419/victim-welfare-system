const mongoose = require('mongoose');

const DEFAULT_TEST_DATABASE = 'aarohan_test';
const SERVER_SELECTION_TIMEOUT_MS = 5000;
let activeMemoryServer = null;

class DatabaseConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

class DatabaseConnectionError extends Error {
  constructor(target, cause) {
    super(`Unable to connect to persistent MongoDB at ${target}. Check MONGO_URI and MongoDB availability.`);
    this.name = 'DatabaseConnectionError';
    this.target = target;
    this.cause = cause;
  }
}

const parseDatabaseName = (pathname) => {
  const databaseName = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  if (!databaseName || databaseName.includes('/')) {
    throw new DatabaseConfigurationError(
      'MONGO_URI must include an explicit database name, for example mongodb://localhost:27017/aarohan.'
    );
  }

  try {
    return decodeURIComponent(databaseName);
  } catch (error) {
    throw new DatabaseConfigurationError('MONGO_URI contains an invalid encoded database name.');
  }
};

const validateMongoUri = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DatabaseConfigurationError(
      'MONGO_URI is required. Configure a persistent MongoDB connection before starting the server.'
    );
  }

  const uri = value.trim();
  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new DatabaseConfigurationError('MONGO_URI must use the mongodb:// or mongodb+srv:// scheme.');
  }

  let parsed;
  try {
    parsed = new URL(uri);
  } catch (error) {
    throw new DatabaseConfigurationError('MONGO_URI is not a valid MongoDB connection string.');
  }

  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol.toLowerCase()) || !parsed.hostname) {
    throw new DatabaseConfigurationError('MONGO_URI is not a valid MongoDB connection string.');
  }

  const databaseName = parseDatabaseName(parsed.pathname);
  const target = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/${databaseName}`;

  return { uri, databaseName, target };
};

const isTestMemoryDbEnabled = () => (
  process.env.NODE_ENV === 'test' && process.env.USE_MEMORY_DB === 'true'
);

const connectToTestMemoryDb = async () => {
  const { MongoMemoryReplSet } = require('mongodb-memory-server');
  activeMemoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = activeMemoryServer.getUri(DEFAULT_TEST_DATABASE);
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
  console.log(`[MongoDB] Test-only in-memory database connected: ${conn.connection.name}`);
  return conn;
};

const connectDB = async () => {
  if (String(process.env.USE_MEMORY_DB).trim() === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new DatabaseConfigurationError(
        'USE_MEMORY_DB is for dev/test only and cannot be enabled in production; refusing disposable storage.'
      );
    }

    return connectToTestMemoryDb();
  }

  const { uri, target } = validateMongoUri(process.env.MONGO_URI);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    });
    console.log(`[MongoDB] Persistent database connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Persistent connection failed for ${target}: ${error.message}`);
    throw new DatabaseConnectionError(target, error);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (activeMemoryServer) {
    await activeMemoryServer.stop();
    activeMemoryServer = null;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  validateMongoUri,
  isTestMemoryDbEnabled,
  DatabaseConfigurationError,
  DatabaseConnectionError,
};
