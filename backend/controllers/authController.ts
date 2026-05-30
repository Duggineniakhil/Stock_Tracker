import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/database';
import logger from '../utils/logger';
import { success, error as apiError } from '../utils/responseWrapper';
import { AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config';

const MAX_LOGIN_ATTEMPTS = config.MAX_LOGIN_ATTEMPTS;
const LOCKOUT_DURATION_MS = config.LOCKOUT_DURATION_MINUTES * 60 * 1000;
const accessTokenOptions = (): jwt.SignOptions => ({ expiresIn: config.JWT_EXPIRES_IN as any });
const refreshTokenOptions = (): jwt.SignOptions => ({ expiresIn: config.JWT_REFRESH_EXPIRES_IN as any });

const parseExpiryMs = (value: string): number => {
    const match = value.match(/^(\d+)([smhd])$/i);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
        case 's': return amount * 1000;
        case 'm': return amount * 60 * 1000;
        case 'h': return amount * 60 * 60 * 1000;
        case 'd': return amount * 24 * 60 * 60 * 1000;
        default: return amount * 1000;
    }
};

const refreshTokenExpiryMs = parseExpiryMs(config.JWT_REFRESH_EXPIRES_IN);

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: config.IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: refreshTokenExpiryMs,
};

const sendRefreshCookie = (res: Response, token: string) => {
    res.cookie('refreshToken', token, refreshTokenCookieOptions);
};

const clearRefreshCookie = (res: Response) => {
    res.clearCookie('refreshToken', { path: '/' });
};

// Password strength: ≥8 chars, 1 uppercase, 1 number
const isStrongPassword = (password: string) => {
    if (password.length < 8) return { valid: false, reason: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { valid: false, reason: 'Password must contain at least one uppercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, reason: 'Password must contain at least one number' };
    return { valid: true };
};

// Check account lockout
const checkLockout = (email: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const since = new Date(Date.now() - LOCKOUT_DURATION_MS).toISOString();
        const sql = `SELECT COUNT(*) as attempts FROM login_attempts 
                     WHERE email = ? AND success = 0 AND attempted_at > ?`;
        db.get(sql, [email, since], (err: Error | null, row: any) => {
            if (err) reject(err);
            else resolve(row?.attempts || 0);
        });
    });
};

const recordLoginAttempt = (email: string, ip: string | undefined, success: boolean) => {
    db.run(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
        [email, ip, success ? 1 : 0],
        (err: Error | null) => { if (err) logger.warn('Failed to record login attempt', { error: err.message }); }
    );
};

const clearLoginAttempts = (email: string) => {
    db.run('DELETE FROM login_attempts WHERE email = ?', [email]);
};

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req: Request, res: Response) => {
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
        db.run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email.toLowerCase(), hashedPassword], function (this: any, err: Error | null) {
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
                config.JWT_SECRET,
                accessTokenOptions()
            );

            const refreshToken = jwt.sign(
                { id: this.lastID, type: 'refresh' },
                config.JWT_REFRESH_SECRET,
                refreshTokenOptions()
            );

            // Store refresh token hash
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const expiresAt = new Date(Date.now() + refreshTokenExpiryMs).toISOString();
            db.run('INSERT OR REPLACE INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [this.lastID, tokenHash, expiresAt]);

            sendRefreshCookie(res, refreshToken);

            return success(res, {
                token: accessToken,
                user: { id: this.lastID, email: email.toLowerCase(), name, plan: 'free' }
            }, 'Account created successfully', 201);
        });
    } catch (error: any) {
        logger.error('Registration error', { error: error.message });
        return apiError(res, 'Server error during registration', null, 500);
    }
};

// ── Login ──────────────────────────────────────────────────────────────────────
const login = async (req: Request, res: Response) => {
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

        db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err: Error | null, user: any) => {
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
                config.JWT_SECRET,
                accessTokenOptions()
            );

            const refreshToken = jwt.sign(
                { id: user.id, type: 'refresh' },
                config.JWT_REFRESH_SECRET,
                refreshTokenOptions()
            );

            // Store refresh token hash
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const expiresAt = new Date(Date.now() + refreshTokenExpiryMs).toISOString();
            db.run('INSERT OR REPLACE INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [user.id, tokenHash, expiresAt]);

            sendRefreshCookie(res, refreshToken);
            logger.info(`User logged in: ${email}`);
            return success(res, {
                token: accessToken,
                expiresIn: 3600,
                user: { id: user.id, email: user.email, plan: user.plan || 'free' }
            }, 'Login successful');
        });
    } catch (err: any) {
        logger.error('Login error', { error: err.message });
        return apiError(res, 'Server error during login', null, 500);
    }
};

// ── Google Login ──────────────────────────────────────────────────────────────
const googleLogin = async (req: Request, res: Response) => {
    const { email, name, photoURL, uid } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;

    if (!email) {
        return apiError(res, 'Email is required', null, 400);
    }

    try {
        db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err: Error | null, user: any) => {
            if (err) return apiError(res, 'Database error', null, 500);

            let userId;
            let userPlan = 'free';

            if (!user) {
                // Create new user for Google login
                // We generate a random password hash since they'll use Google to log in
                const randomPassword = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(randomPassword, 12);
                
                await new Promise<void>((resolve, reject) => {
                    db.run('INSERT INTO users (name, email, password_hash, plan) VALUES (?, ?, ?, ?)', 
                        [name || email.split('@')[0], email.toLowerCase(), hashedPassword, 'free'], 
                        function(this: any, err: Error | null) {
                            if (err) reject(err);
                            else {
                                userId = this.lastID;
                                resolve();
                            }
                        }
                    );
                });
                logger.info(`New user registered via Google: ${email}`);
            } else {
                userId = user.id;
                userPlan = user.plan || 'free';
                // Optionally update name/photo if needed
                db.run('UPDATE users SET name = ? WHERE id = ? AND (name IS NULL OR name = "")', [name, userId]);
            }

            // Issue tokens
            const accessToken = jwt.sign(
                { id: userId, email: email.toLowerCase(), plan: userPlan },
                config.JWT_SECRET,
                accessTokenOptions()
            );

            const refreshToken = jwt.sign(
                { id: userId, type: 'refresh' },
                config.JWT_REFRESH_SECRET,
                refreshTokenOptions()
            );

            // Store refresh token hash
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const expiresAt = new Date(Date.now() + refreshTokenExpiryMs).toISOString();
            db.run('INSERT OR REPLACE INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [userId, tokenHash, expiresAt]);

            sendRefreshCookie(res, refreshToken);
            logger.info(`User logged in via Google: ${email}`);
            return success(res, {
                token: accessToken,
                expiresIn: 3600,
                user: { id: userId, email: email.toLowerCase(), name: name || user?.name, plan: userPlan, photoURL }
            }, 'Google login successful');
        });
    } catch (err: any) {
        logger.error('Google login error', { error: err.message });
        return apiError(res, 'Server error during Google login', null, 500);
    }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
const refreshToken = async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) return apiError(res, 'Refresh token required', null, 400);

    try {
        const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as jwt.JwtPayload;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        db.get('SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > CURRENT_TIMESTAMP',
            [tokenHash], (err: Error | null, storedToken: any) => {
                if (err || !storedToken) {
                    return apiError(res, 'Invalid or expired refresh token', null, 401);
                }

                const newAccessToken = jwt.sign(
                    { id: decoded.id, email: decoded.email },
                    config.JWT_SECRET,
                    accessTokenOptions()
                );

                return success(res, { token: newAccessToken, expiresIn: 3600 }, 'Token refreshed successfully');
            });
    } catch (err: any) {
        return apiError(res, 'Invalid refresh token', null, 401);
    }
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        db.run('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
    }
    clearRefreshCookie(res);
    return success(res, null, 'Logged out successfully');
};

// ── Update Plan (Mock Stripe Integration) ──────────────────────────────────
const updatePlan = (req: Request, res: Response) => {
    const { email, newPlan } = req.body;
    
    if (!email || !newPlan) {
        return apiError(res, 'Email and new plan are required', null, 400);
    }
    
    if (!['free', 'student', 'pro'].includes(newPlan)) {
        return apiError(res, 'Invalid plan type', null, 400);
    }

    db.run('UPDATE users SET plan = ? WHERE email = ?', [newPlan, email.toLowerCase()], function(this: any, err: Error | null) {
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
const updateProfile = (req: AuthenticatedRequest, res: Response) => {
    const { name, email } = req.body;
    const userId = req.user?.id;

    if (!name || !email) {
        return apiError(res, 'Name and email are required', null, 400);
    }

    db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email.toLowerCase(), userId], function(err: Error | null) {
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
const changePassword = async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!currentPassword || !newPassword) {
        return apiError(res, 'Current and new passwords are required', null, 400);
    }

    // Password strength check
    const strength = isStrongPassword(newPassword);
    if (!strength.valid) {
        return apiError(res, strength.reason, null, 400);
    }

    db.get('SELECT password_hash FROM users WHERE id = ?', [userId], async (err: Error | null, user: any) => {
        if (err || !user) return apiError(res, 'User not found', null, 404);

        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordMatch) {
            return apiError(res, 'Incorrect current password', null, 401);
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 12);
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHashedPassword, userId], (updErr: Error | null) => {
            if (updErr) return apiError(res, 'Failed to change password', null, 500);
            return success(res, null, 'Password changed successfully');
        });
    });
};

export = { register, login, googleLogin, refreshToken, logout, updatePlan, updateProfile, changePassword };
