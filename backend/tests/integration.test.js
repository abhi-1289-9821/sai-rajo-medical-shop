const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('API Integration Tests (Real DB)', () => {
  afterAll(async () => {
    // Terminate DB pool to let Jest exit
    await db.pool.end();
  });

  describe('GET /api/orders (unauthorized check)', () => {
    it('should return 401 if request lacks auth token', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
