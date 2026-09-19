require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { getJwtSecret } = require('./utils/jwt');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    getJwtSecret();
    await connectDB();

    if (process.env.SEED_DEMO_DATA !== 'false') {
      console.log('[Server] Initializing seeder...');
      const { seedAllAccounts } = require('./utils/seeder');
      await seedAllAccounts();
      console.log('[Server] Seeder finished.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
