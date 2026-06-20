import React, { useState, useEffect } from 'react';
import { fetchAdminStats, fetchRecentUsers } from '../services/api';
import './Admin.css';

const Admin = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeAlerts: 0,
        totalHoldings: 0,
        planDistribution: { free: 0, student: 0, pro: 0 }
    });
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getAdminData = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    fetchAdminStats(),
                    fetchRecentUsers()
                ]);
                setStats(statsRes.data || statsRes);
                setUsers(usersRes.data || usersRes);
            } catch (err) {
                console.error('Error fetching admin data:', err);
                alert('Failed to load admin data. Are you an admin?');
            } finally {
                setLoading(false);
            }
        };
        getAdminData();
    }, []);

    if (loading) return <div className="page-loader">Loading Admin Portal...</div>;

    const paidCount = (stats.planDistribution?.pro || 0) + (stats.planDistribution?.student || 0);

    return (
        <div className="admin-page">
            <header className="admin-header reveal">
                <div className="hbadge"><span className="ldot"></span> Command Center</div>
                <h1 className="syne">Platform Admin.</h1>
            </header>

            <div className="stats-grid">
                <div className="stat-card reveal">
                    <div className="stat-val">{stats.totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card reveal">
                    <div className="stat-val">{stats.activeAlerts}</div>
                    <div className="stat-label">Active Alerts</div>
                </div>
                <div className="stat-card reveal">
                    <div className="stat-val">{stats.totalHoldings}</div>
                    <div className="stat-label">Total Holdings</div>
                </div>
                <div className="stat-card reveal highlight">
                    <div className="stat-val">{paidCount}</div>
                    <div className="stat-label">Paid Subscribers</div>
                </div>
            </div>

            <div className="admin-content reveal">
                <div className="sec-header">
                    <h2 className="syne">Recent Users</h2>
                </div>
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Plan</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map((u, i) => (
                                <tr key={u.id || i}>
                                    <td>{u.name || 'N/A'}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`p-badge ${u.plan}`}>{u.plan}</span></td>
                                    <td>{u.joined}</td>
                                    <td>
                                        <button className="small-link">Manage</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 'var(--sp-24)' }}>No recent users</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
