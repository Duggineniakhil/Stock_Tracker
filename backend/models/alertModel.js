const db = require('../db/database');

const alertModel = {
    // Create a new alert (user specific)
    createAlert: (userId, symbol, message, alertType, reason = '') => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO user_alerts (user_id, symbol, message, reason) VALUES (?, ?, ?, ?)';
            db.run(query, [userId, symbol.toUpperCase(), message, reason], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        userId,
                        symbol: symbol.toUpperCase(),
                        message,
                        reason
                    });
                }
            });
        });
    },

    // Get all alerts for a user with pagination
    getAllAlerts: (userId, limit = 50, offset = 0) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM user_alerts WHERE user_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?';
            db.all(query, [userId, limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Get alert count for a user
    getAlertCount: (userId) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count FROM user_alerts WHERE user_id = ?';
            db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }
};

module.exports = alertModel;
