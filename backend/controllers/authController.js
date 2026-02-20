const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const logger = require('../utils/logger');

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_DURATION_MS = (parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 15) * 60 * 1000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';

// Password strength: ≥8 chars, 1 uppercase, 1 number
const isStrongPassword = (password) => {
    if (password.length < 8) return { valid: false, reason: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { valid: false, reason: 'Password must contain at least one uppercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, reason: 'Password must contain at least one number' };
    return { valid: true };
};

// Check account lockout
const checkLockout = (email) => {
    return new Promise((resolve, reject) => {
        const since = new Date(Date.now() - LOCKOUT_DURATION_MS).toISOString();
        const sql = `SELECT COUNT(*) as attempts FROM login_attempts 
                     WHERE email = ? AND success = 0 AND attempted_at > ?`;
        db.get(sql, [email, since], (err, row) => {
            if (err) reject(err);
            else resolve(row?.attempts || 0);
        });
    });
};

const recordLoginAttempt = (email, ip, success) => {
    db.run(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
        [email, ip, success ? 1 : 0],
        (err) => { if (err) logger.warn('Failed to record login attempt', { error: err.message }); }
    );
};

const clearLoginAttempts = (email) => {
    db.run('DELETE FROM login_attempts WHERE email = ?', [email]);
};

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } });
    }

    // Password strength check
    const strength = isStrongPassword(password);
    if (!strength.valid) {
        return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: strength.reason } });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' } });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email.toLowerCase(), hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Email already registered' } });
                }
                return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } });
            }
            logger.info(`New user registered: ${email}`);
            res.status(201).json({ message: 'Account created successfully', userId: this.lastID });
        });
    } catch (error) {
        logger.error('Registration error', { error: error.message });
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Server error during registration' } });
    }
};

// ── Login ──────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;

    if (!email || !password) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } });
    }

    try {
        // Check lockout
        const attempts = await checkLockout(email.toLowerCase());
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            logger.warn(`Account locked: ${email} - ${attempts} failed attempts`);
            return res.status(423).json({
                error: {
                    code: 'ACCOUNT_LOCKED',
                    message: `Account temporarily locked due to ${MAX_LOGIN_ATTEMPTS} failed attempts. Try again in ${process.env.LOCKOUT_DURATION_MINUTES || 15} minutes.`
                }
            });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
            if (err) return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Login failed' } });
            if (!user) {
                recordLoginAttempt(email, ip, false);
                return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                recordLoginAttempt(email, ip, false);
                const remaining = MAX_LOGIN_ATTEMPTS - (attempts + 1);
                const msg = remaining <= 0
                    ? 'Account will be locked on next failure'
                    : `Invalid credentials. ${remaining} attempts remaining before lockout.`;
                return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: msg } });
            }

            // Success - clear failed attempts and issue tokens
            clearLoginAttempts(email);
            recordLoginAttempt(email, ip, true);

            const accessToken = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
            );

            const refreshToken = jwt.sign(
                { id: user.id, type: 'refresh' },
                JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
            );

            // Store refresh token hash
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            db.run('INSERT OR REPLACE INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [user.id, tokenHash, expiresAt]);

            logger.info(`User logged in: ${email}`);
            res.json({
                token: accessToken,
                refreshToken,
                expiresIn: 3600,
                user: { id: user.id, email: user.email }
            });
        });
    } catch (err) {
        logger.error('Login error', { error: err.message });
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Server error during login' } });
    }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' } });

    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        db.get('SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > CURRENT_TIMESTAMP',
            [tokenHash], (err, storedToken) => {
                if (err || !storedToken) {
                    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } });
                }

                const newAccessToken = jwt.sign(
                    { id: decoded.id, email: decoded.email },
                    JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
                );

                res.json({ token: newAccessToken, expiresIn: 3600 });
            });
    } catch (err) {
        res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' } });
    }
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = (req, res) => {
    const { refreshToken: token } = req.body;
    if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        db.run('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
    }
    res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, refreshToken, logout };
