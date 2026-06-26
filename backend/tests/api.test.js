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
});
