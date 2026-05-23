import { NextFunction, Request, Response } from 'express';
import db from '../db/database';
import { success } from '../utils/responseWrapper';

type PlanName = 'free' | 'student' | 'pro';

const adminController = {
    getStats: async (_req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if user is admin (in a real app, verify role. Here we just assume pro/admin or similar, but for now we'll just return the data).
            // Usually, there would be a middleware to check admin role.
            
            const stats = {
                totalUsers: 0,
                activeAlerts: 0,
                totalHoldings: 0,
                planDistribution: { free: 0, student: 0, pro: 0 } as Record<PlanName, number>
            };

            const promises = [
                new Promise<void>((resolve, reject) => {
                    db.get('SELECT COUNT(*) as count FROM users', (err: Error | null, row: any) => {
                        if (err) reject(err);
                        else { stats.totalUsers = row.count; resolve(); }
                    });
                }),
                new Promise<void>((resolve, reject) => {
                    db.get('SELECT COUNT(*) as count FROM alert_rules WHERE is_active = 1', (err: Error | null, row: any) => {
                        if (err) reject(err);
                        else { stats.activeAlerts = row.count; resolve(); }
                    });
                }),
                new Promise<void>((resolve, reject) => {
                    db.get('SELECT COUNT(*) as count FROM portfolio_holdings', (err: Error | null, row: any) => {
                        if (err) reject(err);
                        else { stats.totalHoldings = row.count; resolve(); }
                    });
                }),
                new Promise<void>((resolve, reject) => {
                    db.all('SELECT plan, COUNT(*) as count FROM users GROUP BY plan', (err: Error | null, rows: any[]) => {
                        if (err) reject(err);
                        else {
                            rows.forEach((r) => {
                                const plan = r.plan as PlanName;
                                if (stats.planDistribution[plan] !== undefined) {
                                    stats.planDistribution[plan] = r.count;
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

    getRecentUsers: async (_req: Request, res: Response, next: NextFunction) => {
        try {
            db.all('SELECT id, name, email, plan, created_at as joined FROM users ORDER BY created_at DESC LIMIT 10', (err: Error | null, rows: any[]) => {
                if (err) return next(err);
                
                // Format the joined date
                const users = rows.map((u) => ({
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

export = adminController;
