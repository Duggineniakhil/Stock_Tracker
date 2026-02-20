const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API Rate Limiter - 100 requests per minute
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again after a minute'
        }
    },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded`, {
            ip: req.ip,
            path: req.path,
            method: req.method
        });
        res.status(429).json(options.message);
    }
});

/**
 * Strict Auth Rate Limiter - 5 requests per minute
 */
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again after a minute'
        }
    },
    handler: (req, res, next, options) => {
        logger.warn(`Auth rate limit exceeded`, {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json(options.message);
    }
});

/**
 * Stock data Rate Limiter - 30 requests per minute
 */
const stockLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many stock requests, please try again after a minute'
        }
    }
});

module.exports = { apiLimiter, authLimiter, stockLimiter };
