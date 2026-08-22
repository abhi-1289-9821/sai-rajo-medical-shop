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
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET env variable is not set!');
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      secret,
      { expiresIn: '24h' }
    );

    // Set httpOnly cookie for secure auth
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

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

/**
 * Verify active JWT session and return refreshed token
 */
const refresh = async (req, res, next) => {
  try {
    const admin = req.admin; // Injected by authMiddleware

    // Verify admin user still exists in DB (revocation/validity check)
    const admins = await db.query(
      'SELECT id, username FROM admins WHERE id = ? LIMIT 1',
      [admin.id]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Admin user no longer exists or session revoked.'
      });
    }

    const currentAdmin = admins[0];

    // Issue a new token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET env variable is not set!');
    }

    const newToken = jwt.sign(
      { id: currentAdmin.id, username: currentAdmin.username },
      secret,
      { expiresIn: '24h' }
    );

    res.cookie('admin_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      token: newToken,
      admin: {
        id: currentAdmin.id,
        username: currentAdmin.username
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin logout: clears authentication cookie
 */
const logout = async (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  login,
  refresh,
  logout
};
