const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

const rateLimit = require('express-rate-limit');

// Rate limiter for admin login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Route for admin login
router.post('/login', loginLimiter, authController.login);

// Route to verify and refresh active admin token session
router.get('/refresh', authMiddleware, authController.refresh);

// Route for admin logout
router.post('/logout', authController.logout);

module.exports = router;
