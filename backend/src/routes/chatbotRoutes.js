const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const rateLimit = require('express-rate-limit');

// Rate limiter for AI Chatbot to protect against spam / API quota exhaustion
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 chat messages per minute
  message: {
    success: false,
    message: 'Too many messages sent in a short time. Please wait a minute before chatting again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public route for customer chatbot interaction
router.post('/chat', chatLimiter, chatbotController.chatWithAI);

module.exports = router;
