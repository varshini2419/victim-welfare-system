const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

const path = require('path');

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static profiles only
app.use('/uploads/profiles', express.static(path.join(__dirname, '../uploads/profiles')));
app.use('/uploads/victim-images', express.static(path.join(__dirname, '../uploads/victim-images')));
// Removed generic /uploads to prevent direct access to /uploads/documents

// Logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes will be imported here
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const victimRoutes = require('./routes/victimRoutes');
const counselorRoutes = require('./routes/counselorRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const callStatusRoutes = require('./routes/callStatusRoutes');
const victimAppointmentRoutes = require('./routes/victimAppointmentRoutes');
const counselorAppointmentRoutes = require('./routes/counselorAppointmentRoutes');
const dailyUpdateRoutes = require('./routes/dailyUpdateRoutes');
const followUpRoutes = require('./routes/followUpRoutes');

const { authLimiter } = require('./middleware/rateLimitMiddleware');

// Mount routes
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/victim', victimRoutes);
app.use('/api/v1/victim/appointments', victimAppointmentRoutes);
app.use('/api/v1/victim/daily-updates', dailyUpdateRoutes);
app.use('/api/v1/counselor', counselorRoutes);
app.use('/api/v1/counselor/appointments', counselorAppointmentRoutes);
app.use('/api/v1/counselor/follow-ups', followUpRoutes);
app.use('/api/v1/emergency', voiceRoutes);
app.use('/api/v1/counselor/notifications', notificationRoutes);
app.use('/api/v1/call-status', callStatusRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
