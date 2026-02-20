const db = require('../db/database');

const alertModel = {
    // ── Alert History ──────────────────────────────────────────────────────────

    createAlert: (userId, symbol, message, alertType = 'SYSTEM', priority = 'MEDIUM', reason = '') => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO user_alerts (user_id, symbol, message, alertType, priority, reason)
                           VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [userId, symbol.toUpperCase(), message, alertType, priority, reason], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, userId, symbol: symbol.toUpperCase(), message, alertType, priority, reason });
            });
        });
    },

    getAllAlerts: (userId, limit = 50, offset = 0, symbol = null) => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM user_alerts WHERE user_id = ?';
            const params = [userId];
            if (symbol) {
                query += ' AND symbol = ?';
                params.push(symbol.toUpperCase());
            }
            query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getAlertCount: (userId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM user_alerts WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    },

    deleteAlert: (alertId, userId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM user_alerts WHERE id = ? AND user_id = ?', [alertId, userId], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes > 0 });
            });
        });
    },

    clearAlertHistory: (userId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM user_alerts WHERE user_id = ?', [userId], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    },

    // ── Alert Rules ──────────────────────────────────────────────────────────

    createRule: (userId, symbol, templateType, operator, value, priority) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO alert_rules (user_id, symbol, template_type, condition_operator, condition_value, priority)
                           VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [userId, symbol.toUpperCase(), templateType, operator, value, priority], function (err) {
                if (err) reject(err);
                else resolve({
                    id: this.lastID, userId, symbol: symbol.toUpperCase(),
                    template_type: templateType, condition_operator: operator,
                    condition_value: value, priority, is_active: 1
                });
            });
        });
    },

    getRules: (userId, symbol = null) => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM alert_rules WHERE user_id = ?';
            const params = [userId];
            if (symbol) { query += ' AND symbol = ?'; params.push(symbol.toUpperCase()); }
            query += ' ORDER BY created_at DESC';
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getAllActiveRules: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM alert_rules WHERE is_active = 1', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    updateRule: (ruleId, userId, updates) => {
        return new Promise((resolve, reject) => {
            const allowed = ['condition_value', 'priority', 'is_active', 'condition_operator'];
            const fields = Object.keys(updates).filter(k => allowed.includes(k));
            if (fields.length === 0) return resolve({ updated: false });
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = fields.map(f => updates[f]);
            const query = `UPDATE alert_rules SET ${setClause} WHERE id = ? AND user_id = ?`;
            db.run(query, [...values, ruleId, userId], function (err) {
                if (err) reject(err);
                else resolve({ updated: this.changes > 0 });
            });
        });
    },

    deleteRule: (ruleId, userId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM alert_rules WHERE id = ? AND user_id = ?', [ruleId, userId], function (err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes > 0 });
            });
        });
    },

    updateRuleLastTriggered: (ruleId) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE alert_rules SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = ?', [ruleId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

module.exports = alertModel;
