require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed Admin for prototype
    const User = require('./models/User');
    const Counselor = require('./models/Counselor');
    const Victim = require('./models/Victim');
    const Case = require('./models/Case');
    const Assignment = require('./models/Assignment');
    const bcrypt = require('bcryptjs');

    const adminEmails = [
      process.env.ADMIN_EMAIL || 'varshini2419@gmail.com',
      'admin@aarohan.org',
      'admin@aarohan.gov.in',
      'admin@gmail.com'
    ];

    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || '1234', 10);
    for (const email of adminEmails) {
      const exists = await User.findOne({ email });
      if (!exists) {
        await User.create({
          email,
          passwordHash: adminPasswordHash,
          role: 'admin',
          status: 'active',
          state: 'Andhra Pradesh',
          district: 'All'
        });
        console.log(`Auto-seeded Admin account: ${email}`);
      }
    }

    // Auto-seed Counselor accounts
    const counselorEmails = [
      'counselor@aarohan.org',
      'counselor@aarohan.gov.in',
      'counselor@gmail.com',
      'counselor@example.com'
    ];

    let primaryCounselor = null;
    let primaryCounselorUser = null;

    for (const counselorEmail of counselorEmails) {
      let counselorUser = await User.findOne({ email: counselorEmail });
      if (!counselorUser) {
        const passwordHash = await bcrypt.hash('1234', 10);
        counselorUser = await User.create({
          email: counselorEmail,
          passwordHash,
          role: 'counselor',
          status: 'active',
          state: 'Andhra Pradesh',
          district: 'All'
        });
      }

      let counselorDoc = await Counselor.findOne({ userId: counselorUser._id });
      if (!counselorDoc) {
        counselorDoc = await Counselor.create({
          userId: counselorUser._id,
          name: 'Priya Verma',
          phone: '+919876543210',
          qualification: 'M.Sc. Clinical Psychology',
          qualifications: ['M.Sc. Clinical Psychology', 'Crisis Counseling Specialist'],
          specialization: 'Trauma & Crisis Counseling',
          verificationStatus: 'approved',
          state: 'Andhra Pradesh',
          district: 'All',
          maxCaseload: 15,
          currentCaseload: 1
        });
        console.log(`Auto-seeded Counselor account: ${counselorEmail}`);
      }

      if (!primaryCounselor) {
        primaryCounselor = counselorDoc;
        primaryCounselorUser = counselorUser;
      }
    }

    // Auto-seed sample Victim and assigned Case for Counselor workspace
    if (primaryCounselor && primaryCounselorUser) {
      const victimEmail = 'victim@aarohan.org';
      let victimUser = await User.findOne({ email: victimEmail });
      if (!victimUser) {
        const passwordHash = await bcrypt.hash('1234', 10);
        victimUser = await User.create({
          email: victimEmail,
          passwordHash,
          role: 'victim',
          status: 'active',
          state: 'Andhra Pradesh',
          district: 'All'
        });

        const victimDoc = await Victim.create({
          userId: victimUser._id,
          name: 'Ananya Sharma',
          phone: '+919123456780',
          socialCategory: 'SC',
          state: 'Andhra Pradesh',
          district: 'All'
        });

        const caseDoc = await Case.create({
          caseId: 'ARH-2026-001',
          victimId: victimUser._id,
          assignedCounselorId: primaryCounselor._id,
          status: 'in-progress',
          category: 'Caste-Based Violence / Humiliation',
          description: 'Victim requires trauma counseling and legal assistance under SC/ST Act.',
          supportRequired: ['Counseling', 'Legal Guidance']
        });

        let adminUser = await User.findOne({ role: 'admin' });
        await Assignment.create({
          victimId: victimUser._id,
          counselorId: primaryCounselorUser._id,
          assignedBy: adminUser._id,
          status: 'active'
        });

        console.log(`Auto-seeded sample Victim & Case ARH-2026-001 assigned to counselor`);
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
