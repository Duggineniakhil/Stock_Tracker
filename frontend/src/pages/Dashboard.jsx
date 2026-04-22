import React, { useState, useEffect } from 'react';
import { fetchPortfolioSummary, fetchPortfolio } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getDashboardData = async () => {
            try {
                const [summaryRes, portfolioRes] = await Promise.all([
                    fetchPortfolioSummary(),
                    fetchPortfolio()
                ]);
                setSummary(summaryRes.data);
                const sortedHoldings = [...portfolioRes.data].sort((a, b) => 
                    (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity)
                ).slice(0, 8);
                setHoldings(sortedHoldings);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };

        getDashboardData();
    }, []);

    if (loading) return <div className="page-loader"><span className="animate-up">QUOTRA...</span></div>;

    const totalValue = summary?.totalValue || 0;
    const totalChangePercent = summary?.totalChangePercent || 0;
    const isPositive = totalChangePercent >= 0;

    return (
        <div className="dashboard-page container">
            <header className="dashboard-header animate-up">
                <div className="hbadge"><span className="ldot"></span> Account Overview</div>
                <h1>
                    {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your Portfolio'},<br />
                    <span className="g-text">At a Glance.</span>
                </h1>
            </header>

            <div className="stat-cards-row animate-up" style={{ animationDelay: '0.1s' }}>
                <div className="glass-card db-stat-card">
                    <div className="db-stat-label">Total Balance</div>
                    <div className="db-stat-value">
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="glass-card db-stat-card">
                    <div className="db-stat-label">24h Change</div>
                    <div className="db-stat-value">
                        <span className={`db-stat-delta ${isPositive ? 'up' : 'down'}`}>
                            {isPositive ? '+' : ''}{totalChangePercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div className="glass-card db-stat-card">
                    <div className="db-stat-label">Active Alerts</div>
                    <div className="db-stat-value">12</div>
                </div>
                <div className="glass-card db-stat-card">
                    <div className="db-stat-label">Market Status</div>
                    <div className="db-stat-value" style={{ fontSize: '14px', color: 'var(--market-green)' }}>
                        ● OPEN
                    </div>
                </div>
            </div>

            <div className="dashboard-grid animate-up" style={{ animationDelay: '0.2s' }}>
                <div className="glass-card main-chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-8)' }}>
                        <h3 style={{ fontSize: '18px' }}>Portfolio Performance</h3>
                        <div className="hero-ctas" style={{ margin: 0, gap: 'var(--sp-2)' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px' }}>1W</button>
                            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px' }}>1M</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px' }}>1Y</button>
                        </div>
                    </div>
                    <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 800 300" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,250 C100,230 200,260 300,180 C400,100 500,150 600,80 C700,10 800,40 800,40 L800,300 L0,300Z" fill="url(#chartGradient)" />
                            <path d="M0,250 C100,230 200,260 300,180 C400,100 500,150 600,80 C700,10 800,40 800,40" fill="none" stroke="var(--accent-green)" strokeWidth="3" />
                        </svg>
                    </div>
                </div>

                <div className="side-panel">
                    <div className="glass-card" style={{ padding: 'var(--sp-6)', flex: 1 }}>
                        <h3 style={{ fontSize: '16px', marginBottom: 'var(--sp-6)' }}>Top Holdings</h3>
                        <div className="holdings-list">
                            {holdings.length > 0 ? holdings.map((h, i) => (
                                <div className="holding-item" key={i}>
                                    <div className="holding-main">
                                        <div className="holding-icon">{h.symbol[0]}</div>
                                        <div className="holding-name">
                                            <span className="holding-symbol">{h.symbol}</span>
                                            <span className="holding-shares">{h.quantity} Shares</span>
                                        </div>
                                    </div>
                                    <div className="holding-stats">
                                        <div className="holding-px">${h.currentPrice?.toFixed(2)}</div>
                                        <div className={`holding-ch ${h.change >= 0 ? 'up' : 'down'}`}>
                                            {h.change >= 0 ? '+' : ''}{h.changePercent?.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="muted" style={{ textAlign: 'center', padding: '2rem', fontSize: '13px' }}>
                                    No assets found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
