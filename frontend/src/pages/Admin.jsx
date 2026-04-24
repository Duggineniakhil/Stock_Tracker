import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/api';
import './Admin.css';

const Admin = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeAlerts: 0,
        totalHoldings: 0,
        planDistribution: { free: 0, student: 0, pro: 0 }
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking admin stats for now
        setTimeout(() => {
            setStats({
                totalUsers: 124,
                activeAlerts: 450,
                totalHoldings: 1205,
                planDistribution: { free: 85, student: 25, pro: 14 }
            });
            setUsers([
                { id: 1, name: 'John Doe', email: 'john@example.com', plan: 'pro', joined: '2026-01-15' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', plan: 'student', joined: '2026-02-10' },
                { id: 3, name: 'Bob Wilson', email: 'bob@example.com', plan: 'free', joined: '2026-03-05' },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <div className="page-loader">Loading Admin Portal...</div>;

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
                    <div className="stat-val">{stats.planDistribution.pro + stats.planDistribution.student}</div>
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
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`p-badge ${u.plan}`}>{u.plan}</span></td>
                                    <td>{u.joined}</td>
                                    <td>
                                        <button className="small-link">Manage</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
