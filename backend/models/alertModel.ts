import db from '../db/database';

const alertModel = {
    // ── Alert History ──────────────────────────────────────────────────────────

    createAlert: (userId: number, symbol: string, message: string, alertType = 'SYSTEM', priority = 'MEDIUM', reason = '') => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO user_alerts (user_id, symbol, message, alertType, priority, reason)
                           VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [userId, symbol.toUpperCase(), message, alertType, priority, reason], function (this: any, err: Error | null) {
                if (err) reject(err);
                else resolve({ id: this.lastID, userId, symbol: symbol.toUpperCase(), message, alertType, priority, reason });
            });
        });
    },

    getAllAlerts: (userId: number, limit = 50, offset = 0, symbol: string | null = null) => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM user_alerts WHERE user_id = ?';
            const params: any[] = [userId];
            if (symbol) {
                query += ' AND symbol = ?';
                params.push(symbol.toUpperCase());
            }
            query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            db.all(query, params, (err: Error | null, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getAlertCount: (userId: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM user_alerts WHERE user_id = ?', [userId], (err: Error | null, row: any) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    },

    deleteAlert: (alertId: number, userId: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM user_alerts WHERE id = ? AND user_id = ?', [alertId, userId], function (this: any, err: Error | null) {
                if (err) reject(err);
                else resolve({ deleted: this.changes > 0 });
            });
        });
    },

    clearAlertHistory: (userId: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM user_alerts WHERE user_id = ?', [userId], function (this: any, err: Error | null) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    },

    markAlertAsRead: (alertId: number, userId: number) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE user_alerts SET is_read = 1 WHERE id = ? AND user_id = ?', [alertId, userId], function (this: any, err: Error | null) {
                if (err) reject(err);
                else resolve({ updated: this.changes > 0 });
            });
        });
    },

    markAllAsRead: (userId: number) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE user_alerts SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId], function (this: any, err: Error | null) {
                if (err) reject(err);
                else resolve({ updated: this.changes });
            });
        });
    },

    getUnreadAlertCount: (userId: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM user_alerts WHERE user_id = ? AND is_read = 0', [userId], (err: Error | null, row: any) => {
                if (err) reject(err);
                else resolve(row?.count || 0);
            });
        });
    },

    // ── Alert Rules ──────────────────────────────────────────────────────────

    createRule: (userId: number, symbol: string, templateType: string, operator: string, value: number, priority: string) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO alert_rules (user_id, symbol, template_type, condition_operator, condition_value, priority)
                           VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [userId, symbol.toUpperCase(), templateType, operator, value, priority], function (this: any, err: Error | null) {
                if (err) reject(err);
                else resolve({
                    id: this.lastID, userId, symbol: symbol.toUpperCase(),
                    template_type: templateType, condition_operator: operator,
                    condition_value: value, priority, is_active: 1
                });
            });
        });
    },

    getRules: (userId: number, symbol: string | null = null) => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM alert_rules WHERE user_id = ?';
            const params: any[] = [userId];
            if (symbol) { query += ' AND symbol = ?'; params.push(symbol.toUpperCase()); }
            query += ' ORDER BY created_at DESC';
            db.all(query, params, (err: Error | null, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getAllActiveRules: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM alert_rules WHERE is_active = 1', [], (err: Error | null, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    updateRule: (ruleId: number, userId: number, updates: Record<string, any>) => {
        return new Promise((resolve, reject) => {
            const allowed = ['condition_value', 'priority', 'is_active', 'condition_operator'];
            const fields = Object.keys(updates).filter(k => allowed.includes(k));
            if (fields.length === 0) return resolve({ updated: false });
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = fields.map(f => updates[f]);
            const query = `UPDATE alert_rules SET ${setClause} WHERE id = ? AND user_id = ?`;
            db.run(query, [...values, ruleId, userId], function (this: any, err: Error | null) {
                if (err) reject(err);
                else resolve({ updated: this.changes > 0 });
            });
        });
    },

    deleteRule: (ruleId: number, userId: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM alert_rules WHERE id = ? AND user_id = ?', [ruleId, userId], function (this: any, err: Error | null) {
                if (err) reject(err);
                else resolve({ deleted: this.changes > 0 });
            });
        });
    },

    updateRuleLastTriggered: (ruleId: number) => {
        return new Promise<void>((resolve, reject) => {
            db.run('UPDATE alert_rules SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = ?', [ruleId], (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

export = alertModel;
