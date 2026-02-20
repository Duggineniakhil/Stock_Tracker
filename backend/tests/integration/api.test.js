/**
 * Backend Integration Tests - API Endpoints
 * Uses supertest to test HTTP endpoints end-to-end
 */

const request = require('supertest');
const app = require('../../server');

// Mock auth middleware for integration tests
jest.mock('../../middleware/auth', () => (req, res, next) => {
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

describe('API Integration Tests', () => {

    describe('GET /api/v1/health', () => {
        it('should return healthy status', async () => {
            const res = await request(app).get('/api/v1/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('OK');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('version');
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
            expect(res.body).toHaveProperty('alerts');
            expect(Array.isArray(res.body.alerts)).toBe(true);
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
                .send({ symbol: 'AAPL' }); // missing message
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/v1/alerts/rules', () => {
        it('should return rules list', async () => {
            const res = await request(app)
                .get('/api/v1/alerts/rules')
                .set('Authorization', 'Bearer test-token');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('rules');
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
                    priority: 'HIGH'
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
                    condition_value: 100
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
});
