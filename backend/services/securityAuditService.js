const db = require('../db/database');
const logger = require('../utils/logger');

/**
 * Security Audit Service
 * Logs security-relevant events to the database for audit trail
 */

const EVENT_TYPES = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    TOKEN_REFRESH: 'TOKEN_REFRESH',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    CSRF_FAILURE: 'CSRF_FAILURE',
    RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
};

const securityAuditService = {
    /**
     * Log a security event
     * @param {string} eventType - One of EVENT_TYPES
     * @param {Object} details - Event details
     */
    log: (eventType, details = {}) => {
        const {
            userId = null,
            email = null,
            ip = null,
            userAgent = null,
            path = null,
            message = ''
        } = details;

        const sql = `INSERT INTO security_audit_log 
            (event_type, user_id, email, ip_address, user_agent, path, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.run(sql, [eventType, userId, email, ip, userAgent, path, message], (err) => {
            if (err) {
                // Don't break the app if audit logging fails, just warn
                logger.warn('Failed to write security audit log', {
                    error: err.message,
                    eventType,
                    email
                });
            }
        });

        // Also log to Winston for centralized logging
        const level = ['LOGIN_FAILURE', 'ACCOUNT_LOCKED', 'CSRF_FAILURE', 'UNAUTHORIZED_ACCESS']
            .includes(eventType) ? 'warn' : 'info';

        logger[level](`[SECURITY] ${eventType}`, {
            userId, email, ip, path, message
        });
    },

    /**
     * Get recent audit events
     * @param {number} limit - Max events to return
     * @param {number} offset - Pagination offset
     * @returns {Promise<Array>}
     */
    getRecentEvents: (limit = 100, offset = 0) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM security_audit_log 
                         ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            db.all(sql, [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    EVENT_TYPES
};

module.exports = securityAuditService;
