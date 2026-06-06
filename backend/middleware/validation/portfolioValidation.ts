import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { error } from '../../utils/responseWrapper';

/**
 * Validation schemas for portfolio endpoints
 */
const schemas = {
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

export const validate = (schemaName: keyof typeof schemas) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const schema = schemas[schemaName];

        if (!schema) {
            return error(res, 'Invalid validation schema', null, 500);
        }

        const { error: validationError, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (validationError) {
            const errors = validationError.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return error(res, 'Validation failed', errors, 400);
        }

        req.body = value;
        next();
    };
};

export { schemas };
