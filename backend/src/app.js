const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Apply global middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static prescription upload files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routing
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Fallback Route for non-existent API endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found.'
  });
});

// Centralized error handler
app.use(errorMiddleware);

module.exports = app;
