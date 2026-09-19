const mongoose = require('mongoose');
const dns = require('dns');

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

// mongodb+srv:// URIs require DNS SRV + TXT lookups, which Node performs with its
// c-ares resolver (dns.resolveSrv/resolveTxt) — NOT the OS resolver. In some
// sandboxed/VPN/locked-down environments c-ares cannot reach any DNS server
// (fails with "querySrv ECONNREFUSED") even though the OS resolver and the Atlas
// endpoint itself are perfectly reachable. Probe SRV discovery against the URI's
// own cluster host; if the OS resolver can't do it, transparently fall back to
// public resolvers for the process. No-op on healthy machines/CI.
const ensureSrvResolution = async (uri) => {
  if (!/^mongodb\+srv:/i.test(uri)) return;

  let host;
  try {
    host = new URL(uri).hostname;
  } catch {
    return;
  }
  if (!host) return;

  const probe = (servers) => new Promise((resolve) => {
    if (servers) dns.setServers(servers);
    const timer = setTimeout(() => resolve(false), 2000);
    dns.resolveSrv(`_mongodb._tcp.${host}`, (err) => {
      clearTimeout(timer);
      resolve(!err);
    });
  });

  const osResolverWorks = await probe(null);
  if (osResolverWorks) return;

  const publicResolverWorks = await probe(['1.1.1.1', '8.8.8.8', '9.9.9.9']);
  if (publicResolverWorks) {
    console.warn(
      '[MongoDB] OS DNS resolver cannot resolve SRV records; using public resolvers (1.1.1.1, 8.8.8.8, 9.9.9.9) for this process.'
    );
  } else {
    console.warn(
      '[MongoDB] SRV discovery failed on both OS and public resolvers; connection will likely fail. Check network/DNS/firewall.'
    );
  }
};

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

  // Make sure the process can actually resolve SRV records before handing the
  // +srv URI to the driver (see ensureSrvResolution above).
  await ensureSrvResolution(uri);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    });
    console.log(`[MongoDB] Persistent database connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Persistent connection failed for ${target}: ${error.message}`);
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MongoDB] Automatically falling back to in-memory database...');
      return connectToTestMemoryDb();
    }
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
