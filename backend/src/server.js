require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { getJwtSecret } = require('./utils/jwt');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    getJwtSecret();
    await connectDB();

    if (process.env.SEED_DEMO_DATA === 'true') {
      const { seedAllAccounts } = require('./utils/seeder');
      await seedAllAccounts();
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
