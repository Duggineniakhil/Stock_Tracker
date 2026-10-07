/**
 * Security regression tests for Google login, plan updates, and admin access
 */

export {};

const jwt = require('jsonwebtoken');

jest.mock('../../db/database', () => ({
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn(),
}));

jest.mock('../../services/firebaseAuthService', () => ({
    isFirebaseAuthConfigured: jest.fn(() => true),
    verifyFirebaseIdToken: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

const db = require('../../db/database');
const firebaseAuth = require('../../services/firebaseAuthService');
const authController = require('../../controllers/authController');
const requireAdmin = require('../../middleware/requireAdmin').default;
const { config } = require('../../config');

const mockRes = () => {
    const res: any = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.cookie = jest.fn(() => res);
    return res;
};

beforeEach(() => {
    jest.clearAllMocks();
    firebaseAuth.isFirebaseAuthConfigured.mockReturnValue(true);
});

describe('googleLogin', () => {
    it('rejects requests without an ID token, even if an email is supplied', async () => {
        const res = mockRes();
        await authController.googleLogin({ body: { email: 'victim@example.com' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(db.get).not.toHaveBeenCalled();
    });

    it('rejects an ID token that fails verification', async () => {
        firebaseAuth.verifyFirebaseIdToken.mockRejectedValue(new Error('bad signature'));
        const res = mockRes();
        await authController.googleLogin({ body: { idToken: 'forged' } }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(db.get).not.toHaveBeenCalled();
    });

    it('returns 503 when Firebase verification is not configured', async () => {
        firebaseAuth.isFirebaseAuthConfigured.mockReturnValue(false);
        const res = mockRes();
        await authController.googleLogin({ body: { idToken: 'anything' } }, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });

    it('uses the verified token email and ignores the email in the body', async () => {
        firebaseAuth.verifyFirebaseIdToken.mockResolvedValue({ uid: 'u1', email: 'real@example.com', name: 'Real' });
        db.get.mockImplementation((_sql: string, params: any[], cb: Function) => {
            cb(null, { id: 7, email: params[0], plan: 'free' });
        });
        const res = mockRes();
        await authController.googleLogin({ body: { idToken: 'valid', email: 'victim@example.com' } }, res);

        expect(db.get.mock.calls[0][1]).toEqual(['real@example.com']);
        const body = res.json.mock.calls[0][0];
        expect(body.data.user.email).toBe('real@example.com');
    });
});

describe('updatePlan', () => {
    it("updates only the authenticated user's plan, ignoring any email in the body", () => {
        db.run.mockImplementation(function (_sql: string, _params: any[], cb: Function) {
            cb.call({ changes: 1 }, null);
        });
        const res = mockRes();
        authController.updatePlan(
            { user: { id: 5, email: 'me@example.com' }, body: { email: 'victim@example.com', newPlan: 'pro' } },
            res
        );

        const [sql, params] = db.run.mock.calls[0];
        expect(sql).toMatch(/WHERE id = \?/);
        expect(params).toEqual(['pro', 5]);

        const body = res.json.mock.calls[0][0];
        const decoded = jwt.verify(body.data.token, config.JWT_SECRET);
        expect(decoded).toMatchObject({ id: 5, plan: 'pro' });
    });

    it('rejects unauthenticated requests', () => {
        const res = mockRes();
        authController.updatePlan({ body: { newPlan: 'pro' } }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(db.run).not.toHaveBeenCalled();
    });
});

describe('requireAdmin', () => {
    const originalAdmins = config.ADMIN_EMAILS;
    afterEach(() => { config.ADMIN_EMAILS = originalAdmins; });

    it('blocks users whose email is not in ADMIN_EMAILS', () => {
        config.ADMIN_EMAILS = ['admin@example.com'];
        db.get.mockImplementation((_sql: string, _params: any[], cb: Function) => cb(null, { email: 'user@example.com' }));
        const res = mockRes();
        const next = jest.fn();
        requireAdmin({ user: { id: 2 }, originalUrl: '/api/v1/admin/stats' }, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows users whose email is in ADMIN_EMAILS', () => {
        config.ADMIN_EMAILS = ['admin@example.com'];
        db.get.mockImplementation((_sql: string, _params: any[], cb: Function) => cb(null, { email: 'Admin@Example.com' }));
        const res = mockRes();
        const next = jest.fn();
        requireAdmin({ user: { id: 1 }, originalUrl: '/api/v1/admin/stats' }, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('denies everyone when no admins are configured', () => {
        config.ADMIN_EMAILS = [];
        const res = mockRes();
        const next = jest.fn();
        requireAdmin({ user: { id: 1 } }, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(db.get).not.toHaveBeenCalled();
    });
});
