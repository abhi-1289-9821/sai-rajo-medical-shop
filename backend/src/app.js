const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Dynamic allowed origins for development, local network, and localhost testing
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://10.155.56.61:5173',
  'http://10.155.56.61:5174'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin or matching local IP subnets
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://10.155.56.')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
