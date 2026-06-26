const db = require('../config/db');
const socketConfig = require('../config/socket');
const telegramBot = require('../utils/telegramBot');

const { randomBytes } = require('crypto');

/**
 * Generate a unique order number (e.g., MED-YYYYMMDD-XXXXXX)
 */
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Use crypto for a cryptographically secure suffix to avoid collisions under concurrency
  const randomSuffix = randomBytes(3).toString('hex').toUpperCase();
  
  return `MED-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Submit a new medicine order (Customer feature)
 */
const createOrder = async (req, res, next) => {
  try {
    const { customer_name, phone, address, medicines_requested } = req.body;

    // Server-side validation
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Full address is required.' });
    }
    if (!medicines_requested || !medicines_requested.trim()) {
      return res.status(400).json({ success: false, message: 'List of medicines requested is required.' });
    }

    // Prescription upload path setup (optional)
    let prescription_url = null;
    if (req.file) {
      // Save path relative to root to serve statically
      prescription_url = `/uploads/${req.file.filename}`;
    }

    const order_number = generateOrderNumber();
    const status = 'pending';

    // Insert order record into database
    const result = await db.query(
      `INSERT INTO orders 
       (order_number, customer_name, phone, address, medicines_requested, prescription_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        customer_name.trim(),
        phone.trim(),
        address.trim(),
        medicines_requested.trim(),
        prescription_url,
        status
      ]
    );

    const insertedOrderId = result.insertId;
    if (!insertedOrderId) {
      throw new Error('Order insertion failed — no insertId returned.');
    }

    // Fetch the created order to get absolute fields/timestamps
    const createdOrders = await db.query('SELECT * FROM orders WHERE id = ?', [insertedOrderId]);
    const order = createdOrders[0];

    // 1. Send Real-Time notification to admin dashboard via Socket.io
    socketConfig.notifyNewOrder(order);

    // 2. Dispatch Telegram notification to store owner
    // Executed asynchronously to ensure it doesn't slow down customer checkout
    telegramBot.sendNewOrderNotification(order).catch((err) => {
      console.error('Telegram notification background error:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all orders (Admin feature)
 */
const getOrders = async (req, res, next) => {
  try {
    const orders = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    
    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (Admin feature)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'rejected', 'delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if order exists
    const orders = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Update database record
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Retrieve updated record
    const updatedOrders = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    const updatedOrder = updatedOrders[0];

    // If order reaches a terminal status (delivered or rejected), clean up prescription file
    if (['rejected', 'delivered'].includes(status) && orders[0].prescription_url) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../', orders[0].prescription_url);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn('[Upload Cleanup] Failed to delete prescription:', err.message);
        } else {
          console.log('[Upload Cleanup] Deleted prescription:', filePath);
        }
      });
    }

    // Notify client of status change in real time via Socket.io
    socketConfig.notifyOrderStatusUpdate(updatedOrder);

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

const getOrderByNumber = async (req, res, next) => {
  try {
    const { order_number } = req.params;
    const { phone } = req.query;

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for verification.'
      });
    }
    
    // Fetch order record from database matching BOTH order number and phone number
    const orders = await db.query(
      'SELECT * FROM orders WHERE order_number = ? AND phone = ?', 
      [order_number, phone.trim()]
    );
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or phone number verification failed.'
      });
    }

    const order = orders[0];

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderByNumber
};
