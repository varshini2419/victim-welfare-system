require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../backend/src/models/User');

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing from environment variables.');
      process.exit(1);
    }
    
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be provided in the environment variables to seed the admin account.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding.');

    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminExists) {
      console.log('Admin account already exists with this email.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    await User.create({
      email: process.env.ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
      status: 'active'
    });

    console.log('Admin account created successfully.');
    process.exit(0);

  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
