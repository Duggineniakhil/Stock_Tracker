const logger = require('../utils/logger');

/**
 * Request/Response Logger Middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Capture original json method to log response body
    const originalJson = res.json.bind(res);

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection?.remoteAddress,
            userId: req.user?.id || null,
            userAgent: req.headers['user-agent']
        };

        if (res.statusCode >= 500) {
            logger.error(`${req.method} ${req.path} ${res.statusCode}`, logData);
        } else if (res.statusCode >= 400) {
            logger.warn(`${req.method} ${req.path} ${res.statusCode}`, logData);
        } else {
            logger.info(`${req.method} ${req.path} ${res.statusCode}`, logData);
        }
    });

    next();
};

module.exports = requestLogger;
