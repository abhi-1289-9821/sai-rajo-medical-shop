const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let io = null;

/**
 * Initializes the Socket.IO server attachment on the HTTP server instance.
 * @param {Object} httpServer - Node HTTP server instance
 */
function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Admin/Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Admin/Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Get the active socket server instance.
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet!');
  }
  return io;
}

/**
 * Emits an event to all connected dashboard clients when a new order is received.
 * @param {Object} orderData - Database record of the placed order
 */
function notifyNewOrder(orderData) {
  if (io) {
    io.emit('new_order_received', orderData);
    console.log(`[Socket.IO] Broadcast new_order_received event for order #${orderData.order_number}`);
  } else {
    console.warn('[Socket.IO] Socket server is not running. Order notification not broadcast.');
  }
}

module.exports = {
  init,
  getIO,
  notifyNewOrder
};
