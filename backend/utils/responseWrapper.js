/**
 * Standardized API Response Wrapper
 * Ensures consistent response format across all endpoints
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array|Object} errors - Detailed errors (validation, etc.)
 * @param {number} statusCode - HTTP status code (default: 400)
 */
const error = (res, message = 'Error', errors = null, statusCode = 400) => {
    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

module.exports = {
    success,
    error
};
