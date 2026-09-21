const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const Victim = require('../models/Victim');
const Case = require('../models/Case');
const Assignment = require('../models/Assignment');

async function seedAllAccounts() {
  try {
    const salt = await bcrypt.genSalt(10);

    // 1. Seed Admin Account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@aarohan.gov';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const adminPassHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'adminpassword123', salt);
      adminUser = await User.create({
        email: adminEmail,
        passwordHash: adminPassHash,
        role: 'admin',
        status: 'active',
        state: 'Andhra Pradesh',
        district: 'All'
      });
      console.log(`[Seed] Admin created: ${adminEmail}`);
    }

    // Also support default prototype admin
    const legacyAdminEmail = 'varshini2419@gmail.com';
    let legacyAdmin = await User.findOne({ email: legacyAdminEmail });
    if (!legacyAdmin) {
      const legacyPassHash = await bcrypt.hash('1234', salt);
      await User.create({
        email: legacyAdminEmail,
        passwordHash: legacyPassHash,
        role: 'admin',
        status: 'active',
        state: 'Andhra Pradesh',
        district: 'All'
      });
      console.log(`[Seed] Prototype Admin created: ${legacyAdminEmail}`);
    }

    // 2. Seed Counselor Account
    const counselorEmail = 'counselor@aarohan.gov';
    let counselorUser = await User.findOne({ email: counselorEmail });
    if (!counselorUser) {
      const counselorPassHash = await bcrypt.hash('counselorpassword123', salt);
      counselorUser = await User.create({
        email: counselorEmail,
        passwordHash: counselorPassHash,
        role: 'counselor',
        status: 'active',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam'
      });
      console.log(`[Seed] Counselor User created: ${counselorEmail}`);
    }

    let counselorProfile = await Counselor.findOne({ userId: counselorUser._id });
    if (!counselorProfile) {
      counselorProfile = await Counselor.create({
        userId: counselorUser._id,
        name: 'Dr. Ananya Sharma',
        phone: '9876543210',
        profession: 'Clinical Psychologist & Trauma Specialist',
        qualification: 'M.Sc Clinical Psychology, Ph.D.',
        qualifications: ['M.Sc Clinical Psychology', 'Certified Trauma Counselor', 'Cognitive Behavioral Therapy'],
        about: 'Specialized in crisis counseling, rehabilitation, and survivor welfare support with 8+ years experience.',
        verificationStatus: 'approved',
        verifiedBy: adminUser._id,
        verifiedAt: new Date(),
        district: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        specialization: 'Trauma & Crisis Counseling',
        gender: 'Female',
        experience: 8,
        maxCaseload: 15,
        currentCaseload: 1
      });
      console.log(`[Seed] Counselor Profile verified & created: Dr. Ananya Sharma`);
    } else {
      // Ensure counselor is approved and active
      counselorProfile.verificationStatus = 'approved';
      await counselorProfile.save();
      counselorUser.status = 'active';
      await counselorUser.save();
    }

    // 3. Seed Victim (Patient) Account
    const victimEmail = 'victim@aarohan.gov';
    const victimPhone = '9876501234';
    const caseId = 'ARH-2026-001';
    const registrationId = 'ARH-REG-001';

    let victimUser = await User.findOne({ email: victimEmail });
    const otpHash = await bcrypt.hash('123456', 10);

    if (!victimUser) {
      const victimPassHash = await bcrypt.hash('victimpassword123', salt);
      victimUser = await User.create({
        email: victimEmail,
        passwordHash: victimPassHash,
        role: 'victim',
        status: 'active',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        registrationId,
        otpHash,
        otpExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Active test OTP
        otpUsed: false,
        otpDeliveryStatus: 'sent'
      });
      console.log(`[Seed] Victim User created: ${victimEmail}`);
    } else {
      victimUser.status = 'active';
      victimUser.otpHash = otpHash;
      victimUser.otpExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      victimUser.otpUsed = false;
      await victimUser.save();
    }

    let victimProfile = await Victim.findOne({ userId: victimUser._id });
    if (!victimProfile) {
      victimProfile = await Victim.create({
        userId: victimUser._id,
        name: 'Priya Verma',
        phone: victimPhone,
        gender: 'Female',
        socialCategory: 'General',
        profession: 'School Educator',
        address: 'Sector 4, Beach Road, Visakhapatnam',
        pinCode: '530003',
        district: 'Visakhapatnam',
        emergencyContacts: [
          { name: 'Rahul Verma', relationship: 'Brother', phone: '9876509999' }
        ]
      });
      console.log(`[Seed] Victim Profile created: Priya Verma (Phone: ${victimPhone})`);
    }

    // 4. Seed Verified Case for the Victim
    let victimCase = await Case.findOne({ caseId });
    if (!victimCase) {
      victimCase = await Case.create({
        caseId,
        victimId: victimUser._id,
        category: 'Physical Violence',
        description: 'Assistance requested for psycho-social counseling, welfare guidance, and rehabilitation.',
        status: 'assigned',
        assignedCounselorId: counselorProfile._id,
        supportRequired: ['Counseling', 'Legal Guidance', 'Medical Support'],
        firDetails: {
          isFiled: true,
          firNumber: 'FIR-2026/894',
          policeStation: 'Three Town PS, Visakhapatnam',
          firDistrict: 'Visakhapatnam',
          firState: 'Andhra Pradesh'
        }
      });
      console.log(`[Seed] Verified Case created: ${caseId}`);
    } else {
      victimCase.status = 'assigned';
      victimCase.victimId = victimUser._id;
      victimCase.assignedCounselorId = counselorProfile._id;
      await victimCase.save();
    }

    // 5. Seed Assignment: Link Victim to Counselor
    let assignment = await Assignment.findOne({ victimId: victimUser._id, status: 'active' });
    if (!assignment) {
      assignment = await Assignment.create({
        victimId: victimUser._id,
        counselorId: counselorUser._id,
        assignedBy: adminUser._id,
        status: 'active'
      });
      console.log(`[Seed] Counselor Dr. Ananya Sharma assigned to Victim Priya Verma`);
    }

    console.log('[Seed] All prototype accounts and verified relationships ready.');
  } catch (error) {
    console.error(`[Seed] Error seeding accounts: ${error.message}`);
  }
}

module.exports = { seedAllAccounts };
