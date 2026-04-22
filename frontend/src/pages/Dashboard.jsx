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
                // Sort by value and take top 6
                const sortedHoldings = [...portfolioRes.data].sort((a, b) => 
                    (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity)
                ).slice(0, 6);
                setHoldings(sortedHoldings);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };

        getDashboardData();
    }, []);

    if (loading) return <div className="page-loader">Loading Dashboard...</div>;

    const totalValue = summary?.totalValue || 0;
    const totalChange = summary?.totalChange || 0;
    const totalChangePercent = summary?.totalChangePercent || 0;
    const isPositive = totalChange >= 0;

    return (
        <div className="dashboard-container">
            <header className="hero" style={{ padding: '3rem 2rem 2rem' }}>
                <div className="hbadge"><span className="ldot"></span> Performance Overview</div>
                <h1 className="syne" style={{ fontSize: '36px' }}>
                    {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your Portfolio'},<br />
                    <span className="g-text">At a Glance.</span>
                </h1>
            </header>

            <div className="db-wrap" style={{ marginTop: '0', maxWidth: '800px' }}>
                <div className="db-bar">
                    <div className="dots">
                        <div className="dot" style={{ background: '#f05050' }}></div>
                        <div className="dot" style={{ background: '#f0a500' }}></div>
                        <div className="dot" style={{ background: '#00e887' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'rgba(226,232,244,0.3)' }}>quotra — dashboard summary</span>
                    <div style={{ width: '46px' }}></div>
                </div>
                <div className="db-body" style={{ padding: '2.5rem' }}>
                    <div className="db-top">
                        <div>
                            <div className="bal-lbl">Total portfolio value</div>
                            <div className="bal-val" style={{ fontSize: '32px' }}>
                                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span style={{ 
                                    fontSize: '14px', 
                                    color: isPositive ? '#00e887' : '#f05050', 
                                    fontFamily: "'DM Sans'",
                                    marginLeft: '12px'
                                }}>
                                    {isPositive ? '+' : ''}{totalChangePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="tabs">
                            <button className="tab">1D</button>
                            <button className="tab">1W</button>
                            <button className="tab a">1M</button>
                            <button className="tab">1Y</button>
                        </div>
                    </div>
                    
                    <div className="chart-box" style={{ height: '120px' }}>
                        <svg viewBox="0 0 590 80" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00e887" stopOpacity=".15" />
                                    <stop offset="100%" stopColor="#00e887" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,70 C25,66 45,62 75,54 C105,46 120,50 150,42 C180,34 200,38 230,28 C260,18 280,24 310,16 C340,8 360,13 390,8 C420,3 450,6 480,4 C510,2 550,5 590,2 L590,80 L0,80Z" fill="url(#cg)" />
                            <path d="M0,70 C25,66 45,62 75,54 C105,46 120,50 150,42 C180,34 200,38 230,28 C260,18 280,24 310,16 C340,8 360,13 390,8 C420,3 450,6 480,4 C510,2 550,5 590,2" fill="none" stroke="#00e887" strokeWidth="1.5" />
                        </svg>
                    </div>

                    <div className="sec-label" style={{ marginBottom: '1.2rem', marginTop: '2rem' }}>Top Holdings</div>
                    <div className="scards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                        {holdings.length > 0 ? holdings.map((h, i) => (
                            <div className="sc" key={i}>
                                <div className="sc-sym">{h.symbol}</div>
                                <div className="sc-nm">{h.quantity} shares</div>
                                <div className="sc-px">${h.currentPrice?.toFixed(2)}</div>
                                <div className={`sc-ch ${h.change >= 0 ? 'up' : 'dn'}`}>
                                    {h.change >= 0 ? '+' : ''}{h.changePercent?.toFixed(2)}%
                                </div>
                            </div>
                        )) : (
                            <div className="muted" style={{ fontSize: '13px', gridColumn: 'span 3', textAlign: 'center', padding: '2rem' }}>
                                No holdings yet. Start by adding an asset in Portfolio.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
