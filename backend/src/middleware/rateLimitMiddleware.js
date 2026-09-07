const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

const chatLimiter = rateLimit({
  windowMs: parseInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  max: parseInt(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS) || 10,
  message: {
    success: false,
    message: 'Chat rate limit exceeded. Please wait a moment before sending more messages.'
  }
});

module.exports = {
  authLimiter,
  chatLimiter
};
