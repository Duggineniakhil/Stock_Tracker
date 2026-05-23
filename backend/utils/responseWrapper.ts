import { Response } from 'express';

/**
 * Standardized API Response Wrapper
 * Ensures consistent response format across all endpoints
 */

/**
 * Send a success response
 */
export const success = (res: Response, data: any = null, message: string = 'Success', statusCode: number = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Send an error response
 */
export const error = (res: Response, message: string = 'Error', errors: any = null, statusCode: number = 400) => {
    const response: { success: boolean; message: string; errors?: any } = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};
