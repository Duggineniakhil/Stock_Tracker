const Joi = require('joi');
const { error } = require('../../utils/responseWrapper');

/**
 * Validation schemas for portfolio endpoints
 */

const schemas = {
    // Schema for adding a new holding
    addHolding: Joi.object({
        symbol: Joi.string()
            .uppercase()
            .pattern(/^[A-Z]{1,5}$/)
            .required()
            .messages({
                'string.pattern.base': 'Symbol must be 1-5 uppercase letters',
                'any.required': 'Symbol is required'
            }),
        quantity: Joi.number()
            .positive()
            .required()
            .messages({
                'number.positive': 'Quantity must be a positive number',
                'any.required': 'Quantity is required'
            }),
        buyPrice: Joi.number()
            .positive()
            .required()
            .messages({
                'number.positive': 'Buy price must be a positive number',
                'any.required': 'Buy price is required'
            }),
        buyDate: Joi.date()
            .max('now')
            .required()
            .messages({
                'date.max': 'Buy date cannot be in the future',
                'any.required': 'Buy date is required'
            })
    }),

    // Schema for updating a holding
    updateHolding: Joi.object({
        symbol: Joi.string()
            .uppercase()
            .pattern(/^[A-Z]{1,5}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Symbol must be 1-5 uppercase letters'
            }),
        quantity: Joi.number()
            .positive()
            .optional()
            .messages({
                'number.positive': 'Quantity must be a positive number'
            }),
        buyPrice: Joi.number()
            .positive()
            .optional()
            .messages({
                'number.positive': 'Buy price must be a positive number'
            }),
        buyDate: Joi.date()
            .max('now')
            .optional()
            .messages({
                'date.max': 'Buy date cannot be in the future'
            })
    }).min(1) // At least one field must be provided
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {Function} Express middleware
 */
const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];

        if (!schema) {
            return error(res, 'Invalid validation schema', null, 500);
        }

        const { error: validationError, value } = schema.validate(req.body, {
            abortEarly: false, // Collect all errors
            stripUnknown: true // Remove unknown fields
        });

        if (validationError) {
            const errors = validationError.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return error(res, 'Validation failed', errors, 400);
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};

module.exports = {
    validate,
    schemas
};
