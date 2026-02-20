const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authenticateToken = require('../middleware/auth');

/**
 * @openapi
 * tags:
 *   name: Alerts
 *   description: Alert history and rule management
 */

router.use(authenticateToken);

/**
 * @openapi
 * /alerts:
 *   get:
 *     tags: [Alerts]
 *     summary: Get alert history
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: symbol
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert list
 */
router.get('/', alertController.getAlerts);

/**
 * @openapi
 * /alerts/{id}:
 *   delete:
 *     tags: [Alerts]
 *     summary: Delete a single alert from history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Alert deleted
 */
router.delete('/:id', alertController.deleteAlert);

/**
 * @openapi
 * /alerts/history/clear:
 *   delete:
 *     tags: [Alerts]
 *     summary: Clear all alert history for current user
 *     responses:
 *       200:
 *         description: History cleared
 */
router.delete('/history/clear', alertController.clearHistory);

// ── Alert Rules ────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /alerts/rules:
 *   get:
 *     tags: [Alerts]
 *     summary: Get all alert rules
 *     responses:
 *       200:
 *         description: List of alert rules
 */
router.get('/rules', alertController.getRules);

/**
 * @openapi
 * /alerts/rules:
 *   post:
 *     tags: [Alerts]
 *     summary: Create a new alert rule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, template_type, condition_operator, condition_value]
 *             properties:
 *               symbol: { type: string }
 *               template_type: { type: string, enum: [PERCENTAGE_CHANGE, TARGET_PRICE, VOLUME_SPIKE] }
 *               condition_operator: { type: string, enum: [ABOVE, BELOW] }
 *               condition_value: { type: number }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL], default: MEDIUM }
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post('/rules', alertController.createRule);

router.put('/rules/:id', alertController.updateRule);
router.delete('/rules/:id', alertController.deleteRule);

// Manual alert (backward compat)
router.post('/', alertController.createManualAlert);

module.exports = router;
