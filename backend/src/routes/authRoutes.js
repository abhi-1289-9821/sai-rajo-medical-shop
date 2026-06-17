const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route for admin login
router.post('/login', authController.login);

module.exports = router;
