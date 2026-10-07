/**
 * Tests for Firebase ID token verification
 */

export {};

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

jest.mock('axios', () => ({ get: jest.fn() }));

const axios = require('axios');
const { config } = require('../../config');
const { verifyFirebaseIdToken } = require('../../services/firebaseAuthService');

const PROJECT_ID = 'test-project';
const KID = 'test-key';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const { privateKey: otherPrivateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

const sign = (claims: Record<string, unknown>, opts: Record<string, unknown> = {}, key = privateKey) =>
    jwt.sign(
        { email: 'User@Example.com', email_verified: true, name: 'User', ...claims },
        key,
        {
            algorithm: 'RS256',
            keyid: KID,
            audience: PROJECT_ID,
            issuer: `https://securetoken.google.com/${PROJECT_ID}`,
            subject: 'uid-123',
            expiresIn: '1h',
            ...opts,
        }
    );

beforeAll(() => {
    config.FIREBASE_PROJECT_ID = PROJECT_ID;
    axios.get.mockResolvedValue({ data: { [KID]: publicPem }, headers: { 'cache-control': 'public, max-age=3600' } });
});

describe('verifyFirebaseIdToken', () => {
    it('accepts a valid token and returns the lowercased email', async () => {
        await expect(verifyFirebaseIdToken(sign({}))).resolves.toMatchObject({
            uid: 'uid-123',
            email: 'user@example.com',
        });
    });

    it('rejects a token signed with a different key', async () => {
        await expect(verifyFirebaseIdToken(sign({}, {}, otherPrivateKey))).rejects.toThrow();
    });

    it('rejects a token for a different Firebase project', async () => {
        await expect(verifyFirebaseIdToken(sign({}, { audience: 'other-project' }))).rejects.toThrow();
    });

    it('rejects a token from a different issuer', async () => {
        await expect(verifyFirebaseIdToken(sign({}, { issuer: 'https://evil.example.com' }))).rejects.toThrow();
    });

    it('rejects an expired token', async () => {
        await expect(verifyFirebaseIdToken(sign({}, { expiresIn: -10 }))).rejects.toThrow();
    });

    it('rejects a token with an unverified email', async () => {
        await expect(verifyFirebaseIdToken(sign({ email_verified: false }))).rejects.toThrow(/verified email/);
    });

    it('rejects an unsigned HS256 token forged with the public key', async () => {
        const forged = jwt.sign({ email: 'a@b.com', email_verified: true }, 'secret', {
            algorithm: 'HS256', keyid: KID, audience: PROJECT_ID,
            issuer: `https://securetoken.google.com/${PROJECT_ID}`, subject: 'x',
        });
        await expect(verifyFirebaseIdToken(forged)).rejects.toThrow();
    });
});
