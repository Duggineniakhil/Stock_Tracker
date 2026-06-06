/**
 * Backend Integration Tests - API Endpoints
 * Uses supertest to test HTTP endpoints end-to-end
 */

export {};

const request = require('supertest');

// Mock auth middleware for integration tests
jest.mock('../../middleware/auth', () => (req: any, res: any, next: any) => {
  req.user = { id: 1, email: 'test@example.com' };
  next();
});

// Mock alert model for controlled responses
jest.mock('../../models/alertModel', () => ({
  getAllAlerts: jest.fn().mockResolvedValue([]),
  getAlertCount: jest.fn().mockResolvedValue(0),
  createAlert: jest.fn().mockResolvedValue({ id: 1, symbol: 'AAPL', message: 'Test' }),
  deleteAlert: jest.fn().mockResolvedValue({ deleted: true }),
  clearAlertHistory: jest.fn().mockResolvedValue({ deleted: 0 }),
  getRules: jest.fn().mockResolvedValue([]),
  createRule: jest.fn().mockResolvedValue({ id: 1, symbol: 'AAPL' }),
  updateRule: jest.fn().mockResolvedValue({ updated: true }),
  deleteRule: jest.fn().mockResolvedValue({ deleted: true }),
}));

const app = require('../../server');
const db = require('../../db/database');

describe('API Integration Tests', () => {
  describe('CORS preflight', () => {
    it('allows the deployed Vercel frontend to call Google auth', async () => {
      const origin = 'https://stock-tracker-lime-nu.vercel.app';
      const res = await request(app)
        .options('/api/v1/auth/google')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(origin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
    });

    it('does not allow unknown browser origins', async () => {
      const res = await request(app)
        .options('/api/v1/auth/google')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/health (legacy)', () => {
    it('should return healthy status (backward compat)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('GET /api/v1/alerts', () => {
    it('should return alerts list', async () => {
      const res = await request(app)
        .get('/api/v1/alerts')
        .set('Authorization', 'Bearer test-token');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('alerts');
      expect(Array.isArray(res.body.data.alerts)).toBe(true);
    });

    it('should accept limit and offset query params', async () => {
      const res = await request(app)
        .get('/api/v1/alerts?limit=10&offset=5')
        .set('Authorization', 'Bearer test-token');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/alerts', () => {
    it('should create a manual alert', async () => {
      const res = await request(app)
        .post('/api/v1/alerts')
        .set('Authorization', 'Bearer test-token')
        .send({ symbol: 'AAPL', message: 'Test alert', priority: 'HIGH' });
      expect(res.status).toBe(201);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/alerts')
        .set('Authorization', 'Bearer test-token')
        .send({ symbol: 'AAPL' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/alerts/rules', () => {
    it('should return rules list', async () => {
      const res = await request(app)
        .get('/api/v1/alerts/rules')
        .set('Authorization', 'Bearer test-token');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('rules');
    });
  });

  describe('POST /api/v1/alerts/rules', () => {
    it('should create an alert rule', async () => {
      const res = await request(app)
        .post('/api/v1/alerts/rules')
        .set('Authorization', 'Bearer test-token')
        .send({
          symbol: 'AAPL',
          template_type: 'TARGET_PRICE',
          condition_operator: 'ABOVE',
          condition_value: 200,
          priority: 'HIGH',
        });
      expect(res.status).toBe(201);
    });

    it('should reject invalid template_type', async () => {
      const res = await request(app)
        .post('/api/v1/alerts/rules')
        .set('Authorization', 'Bearer test-token')
        .send({
          symbol: 'AAPL',
          template_type: 'INVALID',
          condition_operator: 'ABOVE',
          condition_value: 100,
        });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  afterAll((done) => {
    db.close(() => {
      done();
    });
  });
});
