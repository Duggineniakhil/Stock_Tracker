const logger = require('../utils/logger');

/**
 * Input Sanitization Middleware
 * Strips dangerous HTML/script content from request body, query, and params.
 * Protects against XSS and injection attacks.
 */

/**
 * Recursively sanitize all string values in an object
 */
const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        return value
            // Strip HTML tags
            .replace(/<[^>]*>/g, '')
            // Strip javascript: protocol
            .replace(/javascript\s*:/gi, '')
            // Strip on-event handlers
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            // Strip data: URIs (potential XSS)
            .replace(/data\s*:\s*[^,]*,/gi, '')
            // Trim whitespace
            .trim();
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === 'object') {
        return sanitizeObject(value);
    }
    return value;
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {};
    for (const [key, val] of Object.entries(obj)) {
        // Also sanitize keys to prevent prototype pollution
        const safeKey = key.replace(/[^a-zA-Z0-9_\-.]/g, '');
        if (safeKey === '__proto__' || safeKey === 'constructor' || safeKey === 'prototype') {
            logger.warn('Blocked prototype pollution attempt', { key, path: 'sanitize' });
            continue;
        }
        sanitized[safeKey] = sanitizeValue(val);
    }
    return sanitized;
};

const sanitize = (req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
    } catch (err) {
        logger.error('Sanitization error', { error: err.message });
    }

    next();
};

module.exports = sanitize;
