const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * CSRF Protection Middleware
 * Uses double-submit cookie pattern for stateless CSRF protection.
 * - On GET requests: sets a CSRF token cookie + returns it in response header
 * - On state-changing requests (POST/PUT/DELETE): validates the token
 */

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Generate a random CSRF token
 */
const generateToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Middleware to set CSRF token on safe requests and validate on state-changing ones
 */
const csrfProtection = (req, res, next) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    if (safeMethods.includes(req.method)) {
        // Set or refresh the CSRF token on safe requests
        const token = generateToken();
        res.cookie(CSRF_COOKIE, token, {
            httpOnly: false, // Must be readable by JS to send in header
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 2 * 60 * 60 * 1000 // 2 hours
        });
        res.setHeader(CSRF_HEADER, token);
        return next();
    }

    // For state-changing methods, validate the token
    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER];

    if (!cookieToken || !headerToken) {
        logger.warn('CSRF validation failed: missing tokens', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        return res.status(403).json({
            error: {
                code: 'CSRF_VALIDATION_FAILED',
                message: 'CSRF token missing. Please refresh the page and try again.'
            }
        });
    }

    if (cookieToken !== headerToken) {
        logger.warn('CSRF validation failed: token mismatch', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        return res.status(403).json({
            error: {
                code: 'CSRF_VALIDATION_FAILED',
                message: 'CSRF token invalid. Please refresh the page and try again.'
            }
        });
    }

    next();
};

module.exports = csrfProtection;
