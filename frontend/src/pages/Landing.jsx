import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const Landing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Mock ticker data
    const tickerStocks = [
        { symbol: 'AAPL', price: '189.42', change: '+1.24%' },
        { symbol: 'TSLA', price: '242.18', change: '-0.87%' },
        { symbol: 'GOOGL', price: '141.55', change: '+2.01%' },
        { symbol: 'MSFT', price: '378.90', change: '+0.63%' },
        { symbol: 'NVDA', price: '875.40', change: '+3.12%' },
        { symbol: 'AMZN', price: '155.34', change: '-1.10%' },
        { symbol: 'META', price: '484.03', change: '+2.45%' },
    ];

    return (
        <div className="landing-page">
            {/* ── TOP TICKER ────────────────────────────────────────── */}
            <div className="ticker-container">
                <div className="ticker-track">
                    {[...tickerStocks, ...tickerStocks].map((stock, i) => (
                        <div key={i} className="ticker-item">
                            <span className="ticker-symbol">{stock.symbol}</span>
                            <span className="ticker-price">{stock.price}</span>
                            <span className={`ticker-change ${stock.change.startsWith('+') ? 'pos' : 'neg'}`}>
                                {stock.change}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── NAVBAR ────────────────────────────────────────────── */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="brand">
                        <div className="brand-dot"></div>
                        <span>Quotra</span>
                    </div>
                    <div className="nav-links">
                        <a href="#">Markets</a>
                        <a href="#">Portfolio</a>
                        <a href="#">Insights</a>
                        <a href="#">Pricing</a>
                    </div>
                    <div className="nav-actions">
                        {user ? (
                            <Link to="/dashboard" className="btn-primary">Dashboard</Link>
                        ) : (
                            <Link to="/login" className="btn-outline">get started</Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── HERO SECTION ───────────────────────────────────────── */}
            <header className="hero">
                <div className="hero-badge">
                    <span className="badge-dot"></span>
                    Live market data, always on
                </div>
                <h1 className="hero-title">
                    The Market, <br />
                    <span className="text-gradient">Simplified.</span>
                </h1>
                <p className="hero-tagline">
                    Live quotes, portfolio tracking, and real-time insights — built <br />
                    for investors who mean business.
                </p>
                <div className="hero-actions">
                    <Link to="/register" className="btn-hero-primary">Start tracking free</Link>
                    <button className="btn-hero-secondary">See how it works</button>
                </div>
            </header>

            {/* ── DASHBOARD PREVIEW ──────────────────────────────────── */}
            <section className="preview-section">
                <div className="preview-container">
                    <div className="preview-header">
                        <div className="preview-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <div className="preview-title">quotra — main dashboard</div>
                    </div>
                    <div className="preview-body">
                        <div className="preview-metrics">
                            <div className="metric-main">
                                <span className="metric-label">PORTFOLIO VALUE</span>
                                <div className="metric-value-row">
                                    <h2 className="metric-amount">$84,293</h2>
                                    <span className="metric-change pos">+4.7% today</span>
                                </div>
                            </div>
                            <div className="preview-ranges">
                                <span>1D</span><span className="active">1W</span><span>1M</span><span>1Y</span>
                            </div>
                        </div>
                        <div className="preview-chart">
                            <svg viewBox="0 0 800 200" className="chart-svg">
                                <path
                                    d="M0,150 C50,140 100,160 150,145 C200,130 250,110 300,115 C350,120 400,90 450,85 C500,80 550,95 600,75 C650,55 700,60 750,50 C800,40 800,200 0,200 Z"
                                    className="chart-fill"
                                />
                                <path
                                    d="M0,150 C50,140 100,160 150,145 C200,130 250,110 300,115 C350,120 400,90 450,85 C500,80 550,95 600,75 C650,55 700,60 750,50"
                                    className="chart-line"
                                />
                            </svg>
                        </div>
                        <div className="preview-stocks">
                            <div className="stock-card">
                                <div className="stock-info">
                                    <strong>AAPL</strong>
                                    <span>Apple Inc.</span>
                                </div>
                                <div className="stock-price-col">
                                    <div className="price">$189.42</div>
                                    <div className="change pos">+1.24%</div>
                                </div>
                            </div>
                            <div className="stock-card">
                                <div className="stock-info">
                                    <strong>NVDA</strong>
                                    <span>NVIDIA Corp.</span>
                                </div>
                                <div className="stock-price-col">
                                    <div className="price">$875.40</div>
                                    <div className="change pos">+3.12%</div>
                                </div>
                            </div>
                            <div className="stock-card">
                                <div className="stock-info">
                                    <strong>TSLA</strong>
                                    <span>Tesla Inc.</span>
                                </div>
                                <div className="stock-price-col">
                                    <div className="price">$242.18</div>
                                    <div className="change neg">-0.87%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES SECTION ───────────────────────────────────── */}
            <section className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon">◎</div>
                    <h3>Live quotes</h3>
                    <p>Real-time prices across all major exchanges, updated every second.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">▦</div>
                    <h3>Portfolio view</h3>
                    <p>Track your holdings, P&L, and allocation all in one clean dashboard.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">⟑</div>
                    <h3>Market signals</h3>
                    <p>Smart alerts and trend insights so you never miss a move that matters.</p>
                </div>
            </section>
        </div>
    );
};

export default Landing;
