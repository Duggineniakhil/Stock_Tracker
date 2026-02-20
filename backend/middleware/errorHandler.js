const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Global Error Handler Middleware
 * Catches all errors and returns structured JSON responses
 */
const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNAL_ERROR';
    let message = err.message || 'An unexpected error occurred';

    // Handle known operational errors
    if (err instanceof AppError) {
        logger.warn(`Operational error: ${err.message}`, {
            code: err.code,
            statusCode: err.statusCode,
            path: req.path,
            method: req.method
        });
    } else {
        // Unknown/programming errors - log full stack
        logger.error(`Unhandled error: ${err.message}`, {
            stack: err.stack,
            path: req.path,
            method: req.method,
            body: req.body,
            userId: req.user?.id
        });
        // Don't leak internal errors in production
        if (process.env.NODE_ENV === 'production') {
            message = 'An unexpected error occurred';
            code = 'INTERNAL_ERROR';
        }
    }

    // Handle specific error types
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Authentication token has expired';
    } else if (err.code === 'SQLITE_CONSTRAINT') {
        statusCode = 409;
        code = 'CONFLICT';
        message = 'Resource already exists';
    }

    const response = {
        error: {
            code,
            message,
            ...(process.env.NODE_ENV !== 'production' && err.details ? { details: err.details } : {}),
            timestamp: new Date().toISOString(),
            path: req.path
        }
    };

    res.status(statusCode).json(response);
};

/**
 * 404 Handler - must be before errorHandler
 */
const notFoundHandler = (req, res, next) => {
    const { NotFoundError } = require('../utils/errors');
    next(new NotFoundError(`Route ${req.method} ${req.path}`));
};

module.exports = { errorHandler, notFoundHandler };
