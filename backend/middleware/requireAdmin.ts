import { Response, NextFunction } from 'express';
import db from '../db/database';
import { config } from '../config';
import logger from '../utils/logger';
import { error as apiError } from '../utils/responseWrapper';
import { AuthenticatedRequest } from './auth';

/**
 * Allows the request only if the authenticated user's email is listed in ADMIN_EMAILS.
 * The email is read from the database (not the token) so it reflects the current account.
 * Must run after authenticateToken.
 */
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return apiError(res, 'Authentication required', null, 401);

    if (config.ADMIN_EMAILS.length === 0) {
        return apiError(res, 'Admin access is not configured', null, 403);
    }

    db.get('SELECT email FROM users WHERE id = ?', [userId], (err: Error | null, row: any) => {
        if (err) return next(err);

        const email = row?.email?.toLowerCase();
        if (!email || !config.ADMIN_EMAILS.includes(email)) {
            logger.warn('Blocked non-admin access to admin route', { userId, path: req.originalUrl });
            return apiError(res, 'Admin access required', null, 403);
        }

        next();
    });
};

export default requireAdmin;
