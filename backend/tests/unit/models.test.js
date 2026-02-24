/**
 * Backend Unit Tests - Models
 * Tests for alertModel and portfolioModel functions
 */

// Mock the database
jest.mock('../../db/database', () => {
    const mockDb = {
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
    };
    return mockDb;
});

const db = require('../../db/database');
const alertModel = require('../../models/alertModel');

describe('alertModel', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createAlert', () => {
        it('should create an alert successfully', async () => {
            db.run.mockImplementation((query, params, callback) => {
                callback.call({ lastID: 1 }, null);
            });

            const result = await alertModel.createAlert(1, 'AAPL', 'Test alert', 'MANUAL', 'MEDIUM', '');
            expect(result).toMatchObject({ id: 1, symbol: 'AAPL', message: 'Test alert' });
            expect(db.run).toHaveBeenCalledTimes(1);
        });

        it('should reject on database error', async () => {
            db.run.mockImplementation((query, params, callback) => {
                callback.call({}, new Error('DB error'));
            });
            await expect(alertModel.createAlert(1, 'AAPL', 'Test', 'MANUAL')).rejects.toThrow('DB error');
        });

        it('should uppercase the symbol', async () => {
            db.run.mockImplementation((query, params, callback) => {
                callback.call({ lastID: 2 }, null);
            });
            const result = await alertModel.createAlert(1, 'aapl', 'Test', 'MANUAL');
            expect(result.symbol).toBe('AAPL');
        });
    });

    describe('getAllAlerts', () => {
        it('should return alerts for a user', async () => {
            const mockAlerts = [
                { id: 1, symbol: 'AAPL', message: 'Test', timestamp: new Date().toISOString() }
            ];
            db.all.mockImplementation((query, params, callback) => {
                callback(null, mockAlerts);
            });

            const result = await alertModel.getAllAlerts(1, 50, 0);
            expect(result).toEqual(mockAlerts);
            expect(db.all).toHaveBeenCalledTimes(1);
        });

        it('should filter by symbol when provided', async () => {
            db.all.mockImplementation((query, params, callback) => {
                callback(null, []);
            });
            await alertModel.getAllAlerts(1, 50, 0, 'MSFT');
            const callArgs = db.all.mock.calls[0];
            expect(callArgs[0]).toContain('symbol = ?');
            expect(callArgs[1]).toContain('MSFT');
        });
    });

    describe('createRule', () => {
        it('should create an alert rule', async () => {
            db.run.mockImplementation((query, params, callback) => {
                callback.call({ lastID: 5 }, null);
            });
            const result = await alertModel.createRule(1, 'TSLA', 'TARGET_PRICE', 'ABOVE', 300, 'HIGH');
            expect(result).toMatchObject({ id: 5, symbol: 'TSLA', template_type: 'TARGET_PRICE' });
        });
    });

    describe('getAlertCount', () => {
        it('should return count', async () => {
            db.get.mockImplementation((query, params, callback) => {
                callback(null, { count: 42 });
            });
            const count = await alertModel.getAlertCount(1);
            expect(count).toBe(42);
        });
    });
});
