const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route: customer order submission with optional prescription file
router.post('/', upload.single('prescription'), orderController.createOrder);

// Public route: customer tracking order status by order number
router.get('/track/:order_number', orderController.getOrderByNumber);

// Protected routes: admin dashboard order listing and management
router.get('/', authMiddleware, orderController.getOrders);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);

module.exports = router;
