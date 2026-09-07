const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

const { authLimiter } = require('./middleware/rateLimitMiddleware');

// Mount routes
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/victim', victimRoutes);
app.use('/api/v1/counselor', counselorRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
