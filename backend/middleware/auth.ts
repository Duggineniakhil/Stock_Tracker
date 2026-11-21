import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
    user?: any;
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token && req.query.token) {
        token = req.query.token as string;
    }

    if (!token) return res.sendStatus(401);

    // An expired or foreign token means "not authenticated" (401), so the client refreshes or re-logs in
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        req.user = user;
        next();
    });
};

export default authenticateToken;
