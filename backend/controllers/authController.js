const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const logger = require('../utils/logger');
const { success, error: apiError } = require('../utils/responseWrapper');

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
    const { name, email, password } = req.body;

    if (!email || !password) {
        return apiError(res, 'Email and password are required', null, 400);
    }

    // Password strength check
    const strength = isStrongPassword(password);
    if (!strength.valid) {
        return apiError(res, strength.reason, null, 400);
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return apiError(res, 'Invalid email format', null, 400);
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        db.run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email.toLowerCase(), hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return apiError(res, 'Email already registered', null, 409);
                }
                return apiError(res, 'Registration failed', null, 500);
            }
            logger.info(`New user registered: ${email}`);
            
            // Auto-login: Issue tokens immediately
            const accessToken = jwt.sign(
                { id: this.lastID, email: email.toLowerCase(), name: name, plan: 'free' },
                JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
            );

            const refreshToken = jwt.sign(
                { id: this.lastID, type: 'refresh' },
                JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
            );

            // Store refresh token hash
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            db.run('INSERT OR REPLACE INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [this.lastID, tokenHash, expiresAt]);

            return success(res, {
                token: accessToken,
                refreshToken,
                user: { id: this.lastID, email: email.toLowerCase(), name, plan: 'free' }
            }, 'Account created successfully', 201);
        });
    } catch (error) {
        logger.error('Registration error', { error: error.message });
        return apiError(res, 'Server error during registration', null, 500);
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
            return apiError(res, `Account temporarily locked due to ${MAX_LOGIN_ATTEMPTS} failed attempts. Try again in ${process.env.LOCKOUT_DURATION_MINUTES || 15} minutes.`, null, 423);
        }

        db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
            if (err) return apiError(res, 'Login failed', null, 500);
            if (!user) {
                recordLoginAttempt(email, ip, false);
                return apiError(res, 'Invalid email or password', null, 401);
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                recordLoginAttempt(email, ip, false);
                const remaining = MAX_LOGIN_ATTEMPTS - (attempts + 1);
                const msg = remaining <= 0
                    ? 'Account will be locked on next failure'
                    : `Invalid credentials. ${remaining} attempts remaining before lockout.`;
                return apiError(res, msg, null, 401);
            }

            // Success - clear failed attempts and issue tokens
            clearLoginAttempts(email);
            recordLoginAttempt(email, ip, true);

            const accessToken = jwt.sign(
                { id: user.id, email: user.email, plan: user.plan || 'free' },
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
            return success(res, {
                token: accessToken,
                refreshToken,
                expiresIn: 3600,
                user: { id: user.id, email: user.email, plan: user.plan || 'free' }
            }, 'Login successful');
        });
    } catch (err) {
        logger.error('Login error', { error: err.message });
        return apiError(res, 'Server error during login', null, 500);
    }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
    const { refreshToken: token } = req.body;
    if (!token) return apiError(res, 'Refresh token required', null, 400);

    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        db.get('SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > CURRENT_TIMESTAMP',
            [tokenHash], (err, storedToken) => {
                if (err || !storedToken) {
                    return apiError(res, 'Invalid or expired refresh token', null, 401);
                }

                const newAccessToken = jwt.sign(
                    { id: decoded.id, email: decoded.email },
                    JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
                );

                return success(res, { token: newAccessToken, expiresIn: 3600 }, 'Token refreshed successfully');
            });
    } catch (err) {
        return apiError(res, 'Invalid refresh token', null, 401);
    }
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = (req, res) => {
    const { refreshToken: token } = req.body;
    if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        db.run('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
    }
    return success(res, null, 'Logged out successfully');
};

// ── Update Plan (Mock Stripe Integration) ──────────────────────────────────
const updatePlan = (req, res) => {
    const { email, newPlan } = req.body;
    
    if (!email || !newPlan) {
        return apiError(res, 'Email and new plan are required', null, 400);
    }
    
    if (!['free', 'student', 'pro'].includes(newPlan)) {
        return apiError(res, 'Invalid plan type', null, 400);
    }

    db.run('UPDATE users SET plan = ? WHERE email = ?', [newPlan, email.toLowerCase()], function(err) {
        if (err) {
            logger.error('Error updating plan', { error: err.message });
            return apiError(res, 'Failed to update subscription plan', null, 500);
        }
        
        if (this.changes === 0) {
            return apiError(res, 'User not found', null, 404);
        }
        
        return success(res, { plan: newPlan }, `Successfully upgraded to ${newPlan} plan`);
    });
};

// ── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!name || !email) {
        return apiError(res, 'Name and email are required', null, 400);
    }

    db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email.toLowerCase(), userId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return apiError(res, 'Email already in use', null, 409);
            }
            logger.error('Error updating profile', { error: err.message });
            return apiError(res, 'Failed to update profile', null, 500);
        }
        return success(res, { name, email }, 'Profile updated successfully');
    });
};

// ── Change Password ─────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return apiError(res, 'Current and new passwords are required', null, 400);
    }

    // Password strength check
    const strength = isStrongPassword(newPassword);
    if (!strength.valid) {
        return apiError(res, strength.reason, null, 400);
    }

    db.get('SELECT password_hash FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err || !user) return apiError(res, 'User not found', null, 404);

        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordMatch) {
            return apiError(res, 'Incorrect current password', null, 401);
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 12);
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHashedPassword, userId], (updErr) => {
            if (updErr) return apiError(res, 'Failed to change password', null, 500);
            return success(res, null, 'Password changed successfully');
        });
    });
};

module.exports = { register, login, refreshToken, logout, updatePlan, updateProfile, changePassword };
