const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authMiddleware = (req, res, next) => {
  try {
    let token = null;

    // Support extracting token from Authorization header or from URL query string
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
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
