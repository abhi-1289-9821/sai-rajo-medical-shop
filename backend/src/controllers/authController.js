const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Handle admin login and issue JWT
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    // Query admin in database (SQL Injection protected via db.query's prepared statements)
    const admins = await db.query(
      'SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const admin = admins[0];

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'supersecure_medi_store_secret_jwt_key_123!',
      { expiresIn: '24h' }
    );

    // Return response with credentials
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login
};
