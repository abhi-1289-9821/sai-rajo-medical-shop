const db = require('../config/db');
const socketConfig = require('../config/socket');
const telegramBot = require('../utils/telegramBot');

/**
 * Generate a unique order number (e.g., MED-YYYYMMDD-XXXX)
 */
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // 4-digit random number
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  
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

/**
 * Retrieve order tracking details by order number (Public feature)
 */
const getOrderByNumber = async (req, res, next) => {
  try {
    const { order_number } = req.params;
    
    // Fetch order record from database
    const orders = await db.query('SELECT * FROM orders WHERE order_number = ?', [order_number]);
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
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
