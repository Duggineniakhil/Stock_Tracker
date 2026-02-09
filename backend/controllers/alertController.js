const alertModel = require('../models/alertModel');

const alertController = {
    // Get all alerts
    getAlerts: async (req, res) => {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            const alerts = await alertModel.getAllAlerts(userId, limit, offset);
            const totalCount = await alertModel.getAlertCount(userId);

            res.json({
                alerts,
                totalCount,
                limit,
                offset
            });
        } catch (error) {
            console.error('Error fetching alerts:', error);
            res.status(500).json({ error: 'Failed to fetch alerts' });
        }
    },

    // Create manual alert (Optional)
    createManualAlert: async (req, res) => {
        try {
            const userId = req.user.id;
            const { symbol, message, alertType } = req.body;

            if (!symbol || !message) {
                return res.status(400).json({ error: 'Symbol and message are required' });
            }

            const result = await alertModel.createAlert(userId, symbol, message, alertType || 'MANUAL');
            res.status(201).json(result);
        } catch (error) {
            console.error('Error creating alert:', error);
            res.status(500).json({ error: 'Failed to create alert' });
        }
    }
};

module.exports = alertController;
