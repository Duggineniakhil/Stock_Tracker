const db = require('../db/database');
const { success, error } = require('../utils/responseWrapper');

const adminController = {
    getStats: async (req, res, next) => {
        try {
            // Check if user is admin (in a real app, verify role. Here we just assume pro/admin or similar, but for now we'll just return the data).
            // Usually, there would be a middleware to check admin role.
            
            const stats = {
                totalUsers: 0,
                activeAlerts: 0,
                totalHoldings: 0,
                planDistribution: { free: 0, student: 0, pro: 0 }
            };

            const promises = [
                new Promise((resolve, reject) => {
                    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                        if (err) reject(err);
                        else { stats.totalUsers = row.count; resolve(); }
                    });
                }),
                new Promise((resolve, reject) => {
                    db.get('SELECT COUNT(*) as count FROM alert_rules WHERE is_active = 1', (err, row) => {
                        if (err) reject(err);
                        else { stats.activeAlerts = row.count; resolve(); }
                    });
                }),
                new Promise((resolve, reject) => {
                    db.get('SELECT COUNT(*) as count FROM portfolio_holdings', (err, row) => {
                        if (err) reject(err);
                        else { stats.totalHoldings = row.count; resolve(); }
                    });
                }),
                new Promise((resolve, reject) => {
                    db.all('SELECT plan, COUNT(*) as count FROM users GROUP BY plan', (err, rows) => {
                        if (err) reject(err);
                        else {
                            rows.forEach(r => {
                                if (stats.planDistribution[r.plan] !== undefined) {
                                    stats.planDistribution[r.plan] = r.count;
                                }
                            });
                            resolve();
                        }
                    });
                })
            ];

            await Promise.all(promises);

            return success(res, stats, 'Admin stats fetched');
        } catch (err) {
            next(err);
        }
    },

    getRecentUsers: async (req, res, next) => {
        try {
            db.all('SELECT id, name, email, plan, created_at as joined FROM users ORDER BY created_at DESC LIMIT 10', (err, rows) => {
                if (err) return next(err);
                
                // Format the joined date
                const users = rows.map(u => ({
                    ...u,
                    joined: new Date(u.joined).toISOString().split('T')[0]
                }));
                
                return success(res, users, 'Recent users fetched');
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = adminController;
