const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function getCookie(req, name) {
  if (req.cookies && req.cookies[name]) return req.cookies[name];
  if (req.headers && req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (let c of rawCookies) {
      const [key, value] = c.trim().split('=');
      if (key === name) return decodeURIComponent(value);
    }
  }
  return null;
}

const authMiddleware = (req, res, next) => {
  try {
    // Extract token from httpOnly cookie or Authorization header
    let token = getCookie(req, 'admin_token') || getCookie(req, 'token');

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration.'
      });
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired authentication token.'
        });
      }
      
      req.admin = {
        id: decoded.id,
        username: decoded.username
      };
      next();
    });
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

module.exports = authMiddleware;
