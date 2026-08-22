const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db');
jest.mock('../src/utils/telegramBot', () => ({
  sendNewOrderNotification: jest.fn().mockResolvedValue(true)
}));

describe('API Tests', () => {
  afterAll(async () => {
    await db.pool.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 on invalid credentials', async () => {
      db.query.mockResolvedValue([]); // No admin found

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should log in successfully and return a token', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.query.mockResolvedValue([{ id: 1, username: 'admin', password_hash: hashedPassword }]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('POST /api/orders', () => {
    it('should create an order successfully', async () => {
      db.query.mockResolvedValueOnce({ insertId: 123 }); // Insert statement results
      db.query.mockResolvedValueOnce([{
        id: 123,
        order_number: 'MED-20260626-AAAAAA',
        customer_name: 'Test Customer',
        phone: '9876543210',
        address: 'Test Address',
        medicines_requested: 'Aspirin',
        status: 'pending'
      }]); // Select created order result

      const res = await request(app)
        .post('/api/orders')
        .send({
          customer_name: 'Test Customer',
          phone: '+91 98765 43210',
          address: 'Test Address',
          medicines_requested: '1. Aspirin (1 Strips)'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order.order_number).toBeDefined();
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status successfully when authorized', async () => {
      const mockToken = jwt.sign({ id: 1, username: 'admin' }, process.env.JWT_SECRET || 'test_secret');
      
      db.query.mockResolvedValueOnce([{ id: 123, status: 'pending', prescription_url: null }]); // Check order exists
      db.query.mockResolvedValueOnce({}); // Update execution
      db.query.mockResolvedValueOnce([{ id: 123, status: 'accepted', prescription_url: null }]); // Select updated order

      const res = await request(app)
        .patch('/api/orders/123/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'accepted' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.status).toBe('accepted');
    });
  });

  describe('POST /api/chatbot/chat', () => {
    it('should return 400 if message is missing', async () => {
      const res = await request(app)
        .post('/api/chatbot/chat')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return chatbot response using fallback when API key is not configured', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const res = await request(app)
          .post('/api/chatbot/chat')
          .send({ message: 'Do you sell Dolo 650?' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.reply).toBeDefined();
        expect(res.body.reply).toContain('Dolo 650');
      } finally {
        if (originalKey) process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('should return specific medicine inquiry response for omez-d', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const res = await request(app)
          .post('/api/chatbot/chat')
          .send({ message: 'omez-d' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.reply).toContain('Omez-D');
        expect(res.body.reply).toContain('Omeprazole');
      } finally {
        if (originalKey) process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('should return a welcoming greeting response for hii', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const res = await request(app)
          .post('/api/chatbot/chat')
          .send({ message: 'hii' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.reply).toContain('Hello! Welcome to Sai Rajo Medical Shop');
      } finally {
        if (originalKey) process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('should return specific medicine inquiry response for omezd without hyphen', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const res = await request(app)
          .post('/api/chatbot/chat')
          .send({ message: 'omezd' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.reply).toContain('Omeprazole');
        expect(res.body.reply).toContain('Omez-D');
      } finally {
        if (originalKey) process.env.GEMINI_API_KEY = originalKey;
      }
    });
  });
});

