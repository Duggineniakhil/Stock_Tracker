import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import alertModelModule from '../models/alertModel';
import logger from '../utils/logger';
import { success, error as apiError } from '../utils/responseWrapper';

const alertModel: any = alertModelModule;

/**
 * @openapi
 * components:
 *   schemas:
 *     AlertRule:
 *       type: object
 */

const alertController = {
    // ── Alert History ──────────────────────────────────────────────────────────

    getAlerts: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
            const offset = parseInt(req.query.offset as string) || 0;
            const symbol = (req.query.symbol as string) || null;

            const [alerts, totalCount] = await Promise.all([
                alertModel.getAllAlerts(userId, limit, offset, symbol),
                alertModel.getAlertCount(userId)
            ]);

            return success(res, { alerts, totalCount, limit, offset }, 'Alerts fetched successfully');
        } catch (err) {
            next(err);
        }
    },

    deleteAlert: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await alertModel.deleteAlert(parseInt(req.params.id), req.user?.id);
            if (!result.deleted) return apiError(res, 'Alert not found', null, 404);
            return success(res, null, 'Alert deleted successfully');
        } catch (err) {
            next(err);
        }
    },

    clearHistory: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await alertModel.clearAlertHistory(req.user?.id);
            return success(res, { deleted: result.deleted }, `Cleared ${result.deleted} alerts`);
        } catch (err) {
            next(err);
        }
    },

    markAsRead: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await alertModel.markAlertAsRead(parseInt(req.params.id), req.user?.id);
            if (!result.updated) return apiError(res, 'Alert not found', null, 404);
            return success(res, null, 'Alert marked as read');
        } catch (err) {
            next(err);
        }
    },

    markAllAsRead: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await alertModel.markAllAsRead(req.user?.id);
            return success(res, { updated: result.updated }, `Marked ${result.updated} alerts as read`);
        } catch (err) {
            next(err);
        }
    },

    getUnreadCount: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const count = await alertModel.getUnreadAlertCount(req.user?.id);
            return success(res, { count }, 'Unread count fetched');
        } catch (err) {
            next(err);
        }
    },

    createManualAlert: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const { symbol, message, alertType, priority } = req.body;
            if (!symbol || !message) {
                return apiError(res, 'Symbol and message are required', null, 400);
            }
            const result = await alertModel.createAlert(userId, symbol, message, alertType || 'MANUAL', priority || 'MEDIUM', '');
            return success(res, result, 'Manual alert created', 201);
        } catch (err) {
            next(err);
        }
    },

    // ── Alert Rules ────────────────────────────────────────────────────────────

    getRules: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const rules = await alertModel.getRules(req.user?.id, (req.query.symbol as string) || null);
            return success(res, { rules, count: rules.length }, 'Alert rules fetched successfully');
        } catch (err) {
            next(err);
        }
    },

    createRule: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const { symbol, template_type, condition_operator, condition_value, priority } = req.body;

            // Validation
            const validTemplates = ['PERCENTAGE_CHANGE', 'TARGET_PRICE', 'VOLUME_SPIKE', 'RSI_OVERSOLD', 'RSI_OVERBOUGHT'];
            const validOps = ['ABOVE', 'BELOW'];
            const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

            if (!symbol || !template_type || !condition_operator || condition_value === undefined) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'symbol, template_type, condition_operator, and condition_value are required' } });
            }
            if (!validTemplates.includes(template_type)) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `template_type must be one of: ${validTemplates.join(', ')}` } });
            }
            if (!validOps.includes(condition_operator)) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `condition_operator must be ABOVE or BELOW` } });
            }

            const rule = await alertModel.createRule(
                req.user?.id, symbol, template_type, condition_operator,
                parseFloat(condition_value), priority && validPriorities.includes(priority) ? priority : 'MEDIUM'
            );

            logger.info(`Alert rule created: ${symbol} ${template_type} ${condition_operator} ${condition_value} for user ${req.user?.id}`);
            res.status(201).json(rule);
        } catch (err) {
            next(err);
        }
    },

    updateRule: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await alertModel.updateRule(parseInt(req.params.id), req.user?.id, req.body);
            if (!result.updated) return res.status(404).json({ error: { message: 'Rule not found', code: 'NOT_FOUND' } });
            res.json({ message: 'Rule updated successfully' });
        } catch (err) {
            next(err);
        }
    },

    deleteRule: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await alertModel.deleteRule(parseInt(req.params.id), req.user?.id);
            if (!result.deleted) return res.status(404).json({ error: { message: 'Rule not found', code: 'NOT_FOUND' } });
            res.json({ message: 'Rule deleted successfully' });
        } catch (err) {
            next(err);
        }
    }
};

export = alertController;
