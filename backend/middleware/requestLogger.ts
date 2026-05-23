import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface LoggedRequest extends Request {
    user?: {
        id: number;
        email: string;
        plan: string;
    };
}

/**
 * Request/Response Logger Middleware
 */
const requestLogger = (req: LoggedRequest, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.socket.remoteAddress,
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

export default requestLogger;
