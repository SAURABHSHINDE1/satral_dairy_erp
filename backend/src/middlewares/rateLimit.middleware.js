const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = process.env.NODE_ENV === 'development' ? 10000 : 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  }
});

module.exports = { createRateLimiter, authLimiter };
