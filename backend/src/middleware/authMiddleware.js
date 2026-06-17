const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET || 'supersecure_medi_store_secret_jwt_key_123!', (err, decoded) => {
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
