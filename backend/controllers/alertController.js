const alertModel = require('../models/alertModel');
const logger = require('../utils/logger');

/**
 * @openapi
 * components:
 *   schemas:
 *     AlertRule:
 *       type: object
 */

const alertController = {
    // ── Alert History ──────────────────────────────────────────────────────────

    getAlerts: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const limit = Math.min(parseInt(req.query.limit) || 50, 200);
            const offset = parseInt(req.query.offset) || 0;
            const symbol = req.query.symbol || null;

            const [alerts, totalCount] = await Promise.all([
                alertModel.getAllAlerts(userId, limit, offset, symbol),
                alertModel.getAlertCount(userId)
            ]);

            res.json({ alerts, totalCount, limit, offset });
        } catch (err) {
            next(err);
        }
    },

    deleteAlert: async (req, res, next) => {
        try {
            const result = await alertModel.deleteAlert(parseInt(req.params.id), req.user.id);
            if (!result.deleted) return res.status(404).json({ error: { message: 'Alert not found', code: 'NOT_FOUND' } });
            res.json({ message: 'Alert deleted successfully' });
        } catch (err) {
            next(err);
        }
    },

    clearHistory: async (req, res, next) => {
        try {
            const result = await alertModel.clearAlertHistory(req.user.id);
            res.json({ message: `Cleared ${result.deleted} alerts` });
        } catch (err) {
            next(err);
        }
    },

    createManualAlert: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { symbol, message, alertType, priority } = req.body;
            if (!symbol || !message) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Symbol and message are required' } });
            }
            const result = await alertModel.createAlert(userId, symbol, message, alertType || 'MANUAL', priority || 'MEDIUM', '');
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    },

    // ── Alert Rules ────────────────────────────────────────────────────────────

    getRules: async (req, res, next) => {
        try {
            const rules = await alertModel.getRules(req.user.id, req.query.symbol || null);
            res.json({ rules, count: rules.length });
        } catch (err) {
            next(err);
        }
    },

    createRule: async (req, res, next) => {
        try {
            const { symbol, template_type, condition_operator, condition_value, priority } = req.body;

            // Validation
            const validTemplates = ['PERCENTAGE_CHANGE', 'TARGET_PRICE', 'VOLUME_SPIKE'];
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
                req.user.id, symbol, template_type, condition_operator,
                parseFloat(condition_value), priority && validPriorities.includes(priority) ? priority : 'MEDIUM'
            );

            logger.info(`Alert rule created: ${symbol} ${template_type} ${condition_operator} ${condition_value} for user ${req.user.id}`);
            res.status(201).json(rule);
        } catch (err) {
            next(err);
        }
    },

    updateRule: async (req, res, next) => {
        try {
            const result = await alertModel.updateRule(parseInt(req.params.id), req.user.id, req.body);
            if (!result.updated) return res.status(404).json({ error: { message: 'Rule not found', code: 'NOT_FOUND' } });
            res.json({ message: 'Rule updated successfully' });
        } catch (err) {
            next(err);
        }
    },

    deleteRule: async (req, res, next) => {
        try {
            const result = await alertModel.deleteRule(parseInt(req.params.id), req.user.id);
            if (!result.deleted) return res.status(404).json({ error: { message: 'Rule not found', code: 'NOT_FOUND' } });
            res.json({ message: 'Rule deleted successfully' });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = alertController;
