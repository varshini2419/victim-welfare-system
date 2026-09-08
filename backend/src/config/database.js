const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    
    if (process.env.USE_MEMORY_DB === 'true') {
      const { MongoMemoryReplSet } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      uri = mongoServer.getUri();
      console.log('Using in-memory MongoDB (Replica Set enabled for transactions)');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
