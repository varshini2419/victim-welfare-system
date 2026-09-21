/**
 * Demo data seeder — rich, realistic demo dataset for the AAROHAN prototype.
 *
 * Idempotent: every entity is keyed by email/caseId/eventKey, so re-running
 * only fills what is missing and never duplicates.
 *
 * Storylines (each drives the counselor dashboard differently):
 *  - Priya Verma      ARH-2026-001  Physical Violence          — High risk, recovering (existing account)
 *  - Meera Nair       ARH-2026-002  Sexual Violence            — SEVERE, active crisis (critical alerts, live-style timeline)
 *  - Lakshmi Reddy    ARH-2026-003  Caste-Based Violence       — Moderate, steady improvement over 30 days
 *  - Sofia D'Souza    ARH-2026-004  Threat / Intimidation      — Low risk, nearly resolved (positive trajectory)
 *  - Fatima Sheikh    (pending)     Grievous Hurt              — registration awaiting admin approval
 *
 * Run: node backend/src/utils/seedDemoData.js
 */

const bcrypt = require('bcryptjs');
const dns = require('dns');
const mongoose = require('mongoose');

// Load backend/.env relative to this file (works from any cwd)
const path = require('path');
const fs = require('fs');
(function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
})();

const User = require('../models/User');
const Victim = require('../models/Victim');
const Case = require('../models/Case');
const Assignment = require('../models/Assignment');
const Counselor = require('../models/Counselor');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const EmotionAnalysis = require('../models/EmotionAnalysis');
const Alert = require('../models/Alert');
const Appointment = require('../models/Appointment');
const DailyUpdate = require('../models/DailyUpdate');

const DAY = 24 * 60 * 60 * 1000;

const band = (score) => (score >= 75 ? 'Severe' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low');

// Deterministic pseudo-random so reseeds produce the same shape
let rngState = 42;
const rng = () => {
  rngState = (rngState * 1103515245 + 12345) % 2147483648;
  return rngState / 2147483648;
};
const jitter = (n, spread) => Math.max(0, Math.min(100, Math.round(n + (rng() - 0.5) * spread)));

// An AI-style reply generator per storyline stage
const aiReply = (stage, name) => {
  const r = {
    crisis: `You are not alone in this, ${name}. Immediate help is being arranged — your counselor has been notified and emergency support is available at 112 / Tele-MANAS 14416. Please stay somewhere you feel safe right now.`,
    severe: `What you're carrying sounds incredibly heavy, and it makes complete sense to feel overwhelmed. Article 21 guarantees your right to live with dignity, and the law is on your side. Would you like me to help you reach your counselor today?`,
    worsening: `I hear how much harder this has become since yesterday. Being blamed for something you didn't do is not your burden to carry — Section 79 BNS protects your dignity. Documenting dates and keeping screenshots will strengthen your case.`,
    high: `Thank you for telling me this. Threats and intimidation are punishable under Indian law, and you have every right to report it. Keeping a record of each incident, with dates, will help when you're ready to act.`,
    improving: `That sounds exhausting, but please don't lose hope. The law protects your dignity at work and at home. Your counselor is tracking your progress — would a follow-up session this week help?`,
    recovering: `It takes real strength to talk about this. As a survivor you are protected, not at fault — Section 195A BNS makes threatening a witness a crime. Small steps count: would talking to your counselor help you plan the next one?`,
    moderate: `I'm glad you shared this. The protection you asked about exists — the court's order covers you, and your counselor can help enforce it. How did the week go otherwise?`,
    low: `That's a wonderful sign — rebuilding routines takes courage. Your case support continues for as long as you need it. Is there anything else on your mind today?`,
  };
  return r[stage] || r.moderate;
};

// Victim-authored message pairs per stage. [victimText, stage, distress, emotion, flagged]
const script = (name) => [
  [`I don't know who else to talk to about this.`, 'moderate', 34, 'Sad', false],
  [`Everyone at school saw what happened and nobody said anything.`, 'worsening', 48, 'Sad', false],
  [`I keep replaying it every night, I can't sleep properly.`, 'high', 58, 'Fearful', false],
  [`My hands shake when I get ready for work in the morning.`, 'high', 62, 'Fearful', false],
  [`The accused's family lives two streets away. I saw them yesterday.`, 'severe', 70, 'Fearful', false],
  [`I feel like nothing will ever be normal again.`, 'severe', 74, 'Sad', false],
  [`Sometimes I think everyone would be happier if I wasn't here.`, 'crisis', 96, 'Sad', true],
  [`I'm sorry, that was hard to say. I'm still here.`, 'severe', 80, 'Fearful', false],
  [`I told my sister everything today. She cried with me.`, 'improving', 60, 'Sad', false],
  [`The counselor call helped more than I expected.`, 'improving', 52, 'Calm', false],
  [`I slept almost the whole night for the first time in weeks.`, 'recovering', 42, 'Calm', false],
  [`I went back to work for two hours today.`, 'recovering', 38, 'Hopeful', false],
  [`The hearing date is next month. I'm scared but prepared.`, 'moderate', 30, 'Anxious', false],
  [`I cooked for my family today. It felt like being myself again.`, 'low', 18, 'Hopeful', false],
  [`Thank you for being there through all of this.`, 'low', 12, 'Hopeful', false],
];

const emotionLabelMap = { Sad: 'Sad', Fearful: 'Fearful', Calm: 'Calm', Hopeful: 'Hopeful', Anxious: 'Anxious', Angry: 'Angry', Neutral: 'Neutral' };

// Two turns per day for 30 days, distress following the storyline's arc
function buildHistory(arc) {
  const days = [];
  // Arc shapes: start -> end with a mid-crisis spike for 'crisis-arc'
  for (let d = 29; d >= 0; d--) {
    const progress = (29 - d) / 29; // 0 -> 1 across the month
    let base;
    if (arc === 'crisis-arc') {
      // severe-ish, spiking to crisis around day 24-26, partial recovery after
      base = 62 + progress * 8;
      if (d <= 26 && d >= 23) base = 88 + rng() * 8;
      else if (d < 23 && d >= 18) base = 70 + rng() * 10;
      else if (d < 18 && d >= 8) base = 55 + rng() * 12;
      else if (d < 8) base = 48 + progress * 30;
    } else if (arc === 'improving') {
      base = 68 - progress * 38; // 68 -> 30
    } else if (arc === 'steady-moderate') {
      base = 38 + Math.sin(progress * Math.PI * 2) * 6; // wave around 38
    } else {
      base = 22 - progress * 10; // low and falling
    }
    days.push({ dayOffset: d, distress: jitter(base, 10) });
  }
  return days;
}

const linesFor = (distress, name) => {
  const s = distress >= 90 ? 'crisis' : distress >= 75 ? 'severe' : distress >= 60 ? 'high' : distress >= 45 ? 'worsening' : distress >= 30 ? 'improving' : distress >= 20 ? 'recovering' : 'low';
  const matches = script(name).filter(([, st]) => st === s);
  const pool = matches.length > 0 ? matches : script(name);
  return pool[Math.floor(rng() * pool.length)];
};

async function upsertUser(email, password, role, extras = {}) {
  let user = await User.findOne({ email });
  const salt = await bcrypt.genSalt(10);
  if (!user) {
    user = await User.create({ email, passwordHash: await bcrypt.hash(password, salt), role, status: 'active', ...extras });
    console.log(`  [Seed] User created: ${email}`);
  } else {
    // keep demo logins working
    user.passwordHash = await bcrypt.hash(password, salt);
    if (user.status !== 'active') user.status = 'active';
    await user.save();
  }
  return user;
}

async function seedStoryline({ user, profile, caseDoc, counselorProfile, adminUser, arc, todayBoost = 0 }) {
  const name = profile.name;
  const existingSessions = await ChatSession.find({ victimId: user._id });
  if (existingSessions.length > 0) {
    console.log(`  [Seed] ${name}: chat history already present (${existingSessions.length} sessions) — skipping`);
    return;
  }

  const history = buildHistory(arc);
  // One session per week, so the "Chat Sessions" card and session list look real
  const sessions = [];
  for (let w = 0; w < 5; w++) {
    const startDay = 29 - w * 7;
    const s = await ChatSession.create({
      victimId: user._id,
      title: w === 0 ? 'Weekly check-in' : w === 4 ? 'First conversation' : `Week ${5 - w} check-in`,
      status: 'active',
      createdAt: new Date(Date.now() - startDay * DAY),
      lastMessageAt: new Date(Date.now() - Math.max(0, startDay - 6) * DAY),
    });
    sessions.push({ session: s, startDay, endDay: Math.max(0, startDay - 6) });
  }

  let flaggedCount = 0;
  let latestMetadata = null;
  const allDistress = [];

  for (const { session, startDay, endDay } of sessions) {
    for (let d = startDay; d >= endDay; d--) {
      const plan = history.find((h) => h.dayOffset === d);
      if (!plan) continue;
      const distress = Math.min(100, plan.distress + (d === 0 ? todayBoost : 0));
      const [vText, stage, , emotion, flagged] = linesFor(distress, name);
      const ts = new Date(Date.now() - d * DAY + (9 + Math.floor(rng() * 10)) * 60 * 60 * 1000);
      allDistress.push(distress);

      await ChatMessage.create({
        sessionId: session._id, senderType: 'victim', content: vText,
        isFlagged: !!flagged, createdAt: ts,
        metadata: { distressScore: distress, distressBand: band(distress), emotion: emotionLabelMap[emotion] || 'Neutral', language: 'en', source: 'seed' },
      });
      if (flagged) flaggedCount++;

      await ChatMessage.create({
        sessionId: session._id, senderType: 'ai', content: aiReply(stage, name.split(' ')[0]),
        isFlagged: false, createdAt: new Date(ts.getTime() + 45 * 1000),
        metadata: { emotionResponseFor: emotionLabelMap[emotion] || 'Neutral', language: 'en', source: 'seed' },
      });

      latestMetadata = { distress, emotion: emotionLabelMap[emotion] || 'Neutral', ts };
    }
  }

  // EmotionAnalysis rolling document — drives risk pill, follow-ups, admin list
  const todayDistress = Math.min(100, (history.find(h => h.dayOffset === 0)?.distress || 40) + todayBoost);
  const counts = { Anxious: 0, Sad: 0, Fearful: 0, Angry: 0, Calm: 0, Hopeful: 0, Neutral: 0 };
  script(name).forEach(([, , , e, f]) => { if (f) return; counts[emotionLabelMap[e]] = (counts[emotionLabelMap[e]] || 0) + 1; });
  const breakdown = counts;

  const ea = await EmotionAnalysis.findOne({ victimId: user._id });
  const doc = ea || new EmotionAnalysis({ victimId: user._id, emotionsBreakdown: breakdown, recentLog: [] });
  doc.distressScore = todayDistress;
  doc.distressBand = band(todayDistress);
  doc.primaryEmotion = latestMetadata?.emotion || 'Neutral';
  doc.sessionId = sessions[0].session._id;
  doc.recentLog = script(name).slice(0, 8).map(([text, , ds, emotion], i) => ({
    message: text.substring(0, 100), emotion: emotionLabelMap[emotion], distressScore: ds, timestamp: new Date(Date.now() - i * DAY),
  }));
  if (doc.isNew) await doc.save(); else await doc.save();
  console.log(`  [Seed] ${name}: ${allDistress.length} messages, 5 sessions, EmotionAnalysis(${todayDistress} ${band(todayDistress)})`);

  // Crisis alerts for the crisis storyline (idempotent via eventKey)
  if (arc === 'crisis-arc') {
    const alerts = [
      { sev: 'CRITICAL', type: 'AI_CRISIS_DETECTED', days: 0, hrs: 3, desc: `AI detected a high-risk mental health crisis in victim chat: suicidal ideation detected during evening check-in.`, status: 'NEW' },
      { sev: 'HIGH', type: 'AI_RISK_ESCALATION', days: 2, hrs: 5, desc: 'Distress escalated from Moderate to Severe over 48 hours. Counselor review recommended.', status: 'ACKNOWLEDGED' },
    ];
    for (const a of alerts) {
      const eventKey = `seed:${caseDoc.caseId}:${a.type}:${a.days}d`;
      const exists = await Alert.findOne({ eventKey });
      if (!exists) {
        await Alert.create({
          caseId: caseDoc._id, victimId: user._id, severity: a.sev, alertType: a.type,
          description: a.desc, source: 'AI_RISK', riskScore: a.sev === 'CRITICAL' ? 96 : 78, riskLevel: a.sev,
          status: a.status, eventKey, createdAt: new Date(Date.now() - a.days * DAY - a.hrs * 60 * 60 * 1000),
          acknowledgedAt: a.status === 'ACKNOWLEDGED' ? new Date(Date.now() - (a.days * DAY - 3600 * 1000)) : undefined,
          acknowledgedBy: a.status === 'ACKNOWLEDGED' ? counselorProfile.userId : undefined,
          actionTaken: a.status === 'ACKNOWLEDGED' ? 'Tele-counseling session scheduled within 24 hours.' : undefined,
        });
      }
    }
  }

  // High-risk alert for the improving storyline
  if (arc === 'improving') {
    const eventKey = `seed:${caseDoc.caseId}:AI_RISK_ESCALATION:5d`;
    if (!(await Alert.findOne({ eventKey }))) {
      await Alert.create({
        caseId: caseDoc._id, victimId: user._id, severity: 'HIGH', alertType: 'AI_RISK_ESCALATION',
        description: 'Distress rose above the High threshold after a difficult family interaction. De-escalated after counselor contact.',
        source: 'AI_RISK', riskScore: 68, riskLevel: 'HIGH', status: 'RESOLVED', eventKey,
        createdAt: new Date(Date.now() - 5 * DAY), actionTaken: 'Two tele-counseling sessions held; victim responding well.',
      });
    }
  }

  // Appointments (mix of completed + upcoming) — feeds Follow-Ups and Appointments pages
  const apptDefaults = [
    { d: -21, status: 'COMPLETED', type: 'Initial Consultation', mode: 'in-person', notes: 'Intake session. Safety plan drafted and shared with the victim.' },
    { d: -14, status: 'COMPLETED', type: 'Individual Counseling', mode: 'tele', notes: 'CBT techniques introduced; sleep hygiene discussed.' },
    { d: -7, status: 'COMPLETED', type: 'Follow-up', mode: 'voice', notes: 'Discussed court-hearing anxiety; breathing exercises practised.' },
    { d: 1, status: 'CONFIRMED', type: 'Individual Counseling', mode: 'tele', notes: '' },
    { d: 8, status: 'PENDING', type: 'Follow-up', mode: 'tele', notes: '' },
  ];
  for (const a of apptDefaults) {
    const scheduledAt = new Date(Date.now() + a.d * DAY);
    scheduledAt.setHours(11, 0, 0, 0);
    const exists = await Appointment.findOne({ counselorId: counselorProfile.userId, victimId: user._id, scheduledAt });
    if (!exists) {
      await Appointment.create({
        counselorId: counselorProfile.userId, victimId: user._id, victimName: name,
        title: `${a.type} — ${name.split(' ')[0]}`, scheduledAt, durationMin: 45, mode: a.mode,
        status: a.status, appointmentType: a.type, notes: a.notes,
        caseId: caseDoc._id, createdBy: counselorProfile.userId, createdByRole: 'counselor',
      });
    }
  }

  // Daily self-reported check-ins — feeds the dashboard "self-report" fields
  const feelings = ['Very good', 'Good', 'Okay', 'Bad', 'Very bad'];
  for (let d = 0; d < 10; d++) {
    const feeling = feelings[Math.min(4, Math.floor(todayDistress / 25) + (d % 2 === 0 ? 0 : -1))] || 'Okay';
    const exists = await DailyUpdate.findOne({ victimId: user._id, createdAt: { $gte: new Date(Date.now() - d * DAY - 12 * 60 * 60 * 1000), $lt: new Date(Date.now() - d * DAY + 12 * 60 * 60 * 1000) } });
    if (!exists) {
      await DailyUpdate.create({
        victimId: user._id,
        feeling: todayDistress >= 75 ? (d === 0 ? 'Very bad' : 'Bad') : todayDistress >= 50 ? (d === 0 ? 'Bad' : 'Okay') : (d === 0 ? 'Okay' : feeling),
        content: d === 0
          ? (todayDistress >= 75 ? 'Barely slept. The faces from that night keep coming back.' : todayDistress >= 50 ? 'A rough morning, but I managed to get through my tasks.' : 'Feeling steadier today. Went for a walk.')
          : 'Daily check-in',
        createdAt: new Date(Date.now() - d * DAY - 3 * 60 * 60 * 1000),
      });
    }
  }
}

async function seedDemoData() {
  try {
    // Atlas SRV needs DNS SRV lookups; fall back to public resolvers (same as database.js)
    try {
      await dns.promises.resolveSrv('_mongodb._tcp.cluster0.vk6px0i.mongodb.net');
    } catch {
      dns.setServers(['1.1.1.1', '8.8.8.8', '9.9.9.9']);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log(`[Seed] Connected to ${mongoose.connection.name}`);

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) throw new Error('Run the base seeder first (admin missing)');

    // Second counselor so counselor management + assignment flows have variety
    const counselor2User = await upsertUser('rajesh.kumar@aarohan.gov', 'counselor2password123', 'counselor', { state: 'Andhra Pradesh', district: 'Guntur' });
    let counselor2Profile = await Counselor.findOne({ userId: counselor2User._id });
    if (!counselor2Profile) {
      counselor2Profile = await Counselor.create({
        userId: counselor2User._id, name: 'Dr. Rajesh Kumar', phone: '9849123456',
        profession: 'Rehabilitation & Legal-Aid Counselor', qualification: 'MSW, LLB',
        qualifications: ['MSW', 'LLB', 'Legal-Aid Certified'],
        about: 'Focuses on legal-aid coordination and rehabilitation for survivors of caste-based and land-related violence.',
        verificationStatus: 'approved', verifiedBy: adminUser._id, verifiedAt: new Date(),
        district: 'Guntur', state: 'Andhra Pradesh', specialization: 'Legal-Aid & Rehabilitation', gender: 'Male', experience: 11, maxCaseload: 12, currentCaseload: 2,
      });
      console.log('  [Seed] Counselor profile created: Dr. Rajesh Kumar');
    }

    const counselor1Profile = await Counselor.findOne({ userId: { $ne: counselor2User._id } }).sort({ createdAt: 1 });
    const primaryCounselor = counselor1Profile || counselor2Profile;

    const storylines = [
      {
        email: 'victim@aarohan.gov', password: 'victimpassword123', caseId: 'ARH-2026-001',
        profile: {
          name: 'Priya Verma', phone: '9876501234', gender: 'Female', socialCategory: 'General', profession: 'School Educator',
          address: 'Sector 4, Beach Road, Visakhapatnam', pinCode: '530003', district: 'Visakhapatnam',
          emergencyContacts: [{ name: 'Rahul Verma', relationship: 'Brother', phone: '9876509999' }],
        },
        case: {
          category: 'Physical Violence', status: 'assigned',
          description: 'Assistance requested for psycho-social counseling, welfare guidance, and rehabilitation.',
          supportRequired: ['Counseling', 'Legal Guidance', 'Medical Support'],
          firDetails: { isFiled: true, firNumber: 'FIR-2026/894', policeStation: 'Three Town PS, Visakhapatnam', firDistrict: 'Visakhapatnam', firState: 'Andhra Pradesh' },
        },
        arc: 'improving', todayBoost: 0, counselorProfile: primaryCounselor,
        registrationId: 'ARH-REG-001',
      },
      {
        email: 'meera.nair@aarohan.gov', password: 'meera12345', caseId: 'ARH-2026-002',
        profile: {
          name: 'Meera Nair', phone: '9845678901', gender: 'Female', socialCategory: 'OBC', profession: 'College Student',
          address: 'Flat 302, Sai Enclave, Guntur', pinCode: '522007', district: 'Guntur',
          emergencyContacts: [{ name: 'Devika Nair', relationship: 'Mother', phone: '9845678902' }],
        },
        case: {
          category: 'Sexual Violence', status: 'assigned',
          description: 'Survivor of assault by a known person; currently staying with family. Requires urgent trauma counseling and legal guidance.',
          supportRequired: ['Counseling', 'Legal Guidance', 'Safety / Shelter Support'],
          firDetails: { isFiled: true, firNumber: 'FIR-2026/1127', policeStation: 'Guntur Rural PS', firDistrict: 'Guntur', firState: 'Andhra Pradesh' },
        },
        arc: 'crisis-arc', todayBoost: 6, counselorProfile: primaryCounselor,
      },
      {
        email: 'lakshmi.reddy@aarohan.gov', password: 'lakshmi12345', caseId: 'ARH-2026-003',
        profile: {
          name: 'Lakshmi Reddy', phone: '9959445566', gender: 'Female', socialCategory: 'SC', profession: 'Farm Labourer',
          address: 'Ward 7, Palnadu Sector, Guntur', pinCode: '522100', district: 'Guntur',
          emergencyContacts: [{ name: 'Ravi Reddy', relationship: 'Husband', phone: '9959445567' }],
        },
        case: {
          category: 'Caste-Based Violence / Humiliation', status: 'in-progress',
          description: 'Systemic harassment related to land dispute; social boycott by village members. Legal-aid and community reintegration support requested.',
          supportRequired: ['Legal Guidance', 'Welfare Assistance', 'Counseling'],
          firDetails: { isFiled: true, firNumber: 'FIR-2026/0921', policeStation: 'Palnadu PS', firDistrict: 'Palnadu', firState: 'Andhra Pradesh' },
        },
        arc: 'steady-moderate', todayBoost: 0, counselorProfile: counselor2Profile,
      },
      {
        email: 'sofia.dsouza@aarohan.gov', password: 'sofia12345', caseId: 'ARH-2026-004',
        profile: {
          name: "Sofia D'Souza", phone: '9701122334', gender: 'Female', socialCategory: 'General', profession: 'Software Engineer',
          address: 'Road No 12, Banjara Hills, Visakhapatnam', pinCode: '530034', district: 'Visakhapatnam',
          emergencyContacts: [{ name: 'Mark D\u2019Souza', relationship: 'Father', phone: '9701122335' }],
        },
        case: {
          category: 'Threat / Intimidation', status: 'in-progress',
          description: 'Criminal intimidation by a former colleague after complaint; recovering with counseling support and preparing to resume work.',
          supportRequired: ['Counseling', 'Legal Guidance'],
          firDetails: { isFiled: true, firNumber: 'FIR-2026/1310', policeStation: 'MVP Colony PS', firDistrict: 'Visakhapatnam', firState: 'Andhra Pradesh' },
        },
        arc: 'low-recovering', todayBoost: 0, counselorProfile: primaryCounselor,
      },
    ];

    for (const s of storylines) {
      console.log(`[Seed] Storyline: ${s.profile.name} (${s.caseId})`);
      const user = await upsertUser(s.email, s.password, 'victim', {
        state: s.profile.district === 'Guntur' ? 'Andhra Pradesh' : 'Andhra Pradesh',
        district: s.profile.district,
      });
      let profile = await Victim.findOne({ userId: user._id });
      if (!profile) {
        profile = await Victim.create({ userId: user._id, ...s.profile });
        console.log(`  [Seed] Victim profile created: ${s.profile.name}`);
      }
      let caseDoc = await Case.findOne({ caseId: s.caseId });
      if (!caseDoc) {
        caseDoc = await Case.create({
          caseId: s.caseId, victimId: user._id, ...s.case,
          assignedCounselorId: s.counselorProfile._id, assignedAt: new Date(Date.now() - 20 * DAY),
        });
        console.log(`  [Seed] Case created: ${s.caseId}`);
      } else {
        caseDoc.assignedCounselorId = s.counselorProfile._id;
        if (caseDoc.status === 'pending') caseDoc.status = s.case.status;
        await caseDoc.save();
      }
      const assignmentExists = await Assignment.findOne({ victimId: user._id, counselorId: s.counselorProfile.userId, status: 'active' });
      if (!assignmentExists) {
        await Assignment.create({ victimId: user._id, counselorId: s.counselorProfile.userId, assignedBy: adminUser._id, status: 'active' });
      }
      await seedStoryline({ user, profile, caseDoc, counselorProfile: s.counselorProfile, adminUser, arc: s.arc, todayBoost: s.todayBoost });
    }

    // ── Pending registration request (feeds the admin "Pending Victim Requests" list)
    // Each part is checked independently so an interrupted earlier run gets repaired.
    const pendingEmail = 'fatima.sheikh@example.com';
    let pendingUser = await User.findOne({ email: pendingEmail });
    if (!pendingUser) {
      const salt = await bcrypt.genSalt(10);
      pendingUser = await User.create({
        email: pendingEmail, passwordHash: await bcrypt.hash('fatima12345', salt),
        role: 'victim', status: 'pending', state: 'Andhra Pradesh', district: 'Guntur',
        registrationId: 'ARH-REG-2026-0147',
        otpHash: await bcrypt.hash('123456', 10),
        otpExpiresAt: new Date(Date.now() + 7 * DAY), otpUsed: false, otpDeliveryStatus: 'sent',
      });
      console.log('  [Seed] Pending user created: Fatima Sheikh');
    }
    const pendingProfile = await Victim.findOne({ userId: pendingUser._id });
    if (!pendingProfile) {
      await Victim.create({
        userId: pendingUser._id,
        name: 'Fatima Sheikh', phone: '9652778899', gender: 'Female', socialCategory: 'Other', profession: 'Tailoring Unit Worker',
        address: 'Survey 44, Bhattiprolu Road, Guntur', pinCode: '522014', district: 'Guntur',
        emergencyContacts: [{ name: 'Ayesha Sheikh', relationship: 'Sister', phone: '9652778898' }],
      });
      console.log('  [Seed] Pending victim profile created');
    }
    const pendingCase = await Case.findOne({ victimId: pendingUser._id });
    if (!pendingCase) {
      await Case.create({
        victimId: pendingUser._id, category: 'Grievous Hurt', status: 'pending',
        description: 'Injured in a road-rage attack by neighbours; medical records and FIR copy submitted with the application.',
        supportRequired: ['Medical Support', 'Legal Guidance', 'Welfare Assistance'],
        firDetails: { isFiled: true, firNumber: 'FIR-2026/1402', policeStation: 'Guntur One Town PS', firDistrict: 'Guntur', firState: 'Andhra Pradesh' },
      });
      console.log('  [Seed] Pending case created');
    }
    console.log('[Seed] Pending registration request ready: Fatima Sheikh');

    // Keep counselor caseload counters truthful
    for (const cp of [primaryCounselor, counselor2Profile]) {
      const activeCases = await Case.countDocuments({ assignedCounselorId: cp._id, status: { $in: ['assigned', 'in-progress', 'open'] } });
      cp.currentCaseload = activeCases;
      await cp.save();
    }

    console.log('[Seed] Demo dataset ready.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] FAILED:', error);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

if (require.main === module) seedDemoData();
module.exports = { seedDemoData };
