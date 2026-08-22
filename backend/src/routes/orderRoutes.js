const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const rateLimit = require('express-rate-limit');

// Rate limiter for customer order creation to prevent spam/DoS
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many order submissions from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public route: customer order submission with optional prescription file
router.post('/', orderLimiter, upload.single('prescription'), orderController.createOrder);

// Public route: customer tracking order status by order number
router.get('/track/:order_number', orderController.getOrderByNumber);
router.get('/:order_number', orderController.getOrderByNumber);

// Protected routes: admin dashboard order listing and management
router.get('/', authMiddleware, orderController.getOrders);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);

module.exports = router;
