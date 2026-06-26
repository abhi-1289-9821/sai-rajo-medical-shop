const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Use helmet to secure the app by setting various HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Dynamic allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin or matching configured client URL
    if (!origin || allowedOrigins.includes(origin)) {
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

// Serve static prescription upload files (protected by authentication)
app.use('/uploads', authMiddleware, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint for cloud platforms
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

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
