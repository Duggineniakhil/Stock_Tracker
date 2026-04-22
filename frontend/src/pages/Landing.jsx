import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
    return (
        <div className="landing-page">
            <section className="landing-hero container">
                <div className="hero-glow"></div>
                
                <div className="hero-content animate-up">
                    <div className="hbadge">
                        <span className="ldot"></span>
                        Now trusted by 50,000+ traders
                    </div>
                    
                    <h1 className="hero-title">
                        Master the Market with <br />
                        <span className="g-text">Intelligent Insights.</span>
                    </h1>
                    
                    <p className="hero-subtitle">
                        Experience the next generation of stock tracking. Real-time analytics, 
                        automated alerts, and a professional-grade portfolio manager.
                    </p>
                    
                    <div className="hero-ctas">
                        <Link to="/register">
                            <button className="btn btn-primary" style={{ minWidth: '180px' }}>
                                Start Trading Free
                            </button>
                        </Link>
                        <Link to="/markets">
                            <button className="btn btn-secondary" style={{ minWidth: '180px' }}>
                                View Markets
                            </button>
                        </Link>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-val">$2.4B+</div>
                            <div className="stat-lbl">Assets Tracked</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-val">99.9%</div>
                            <div className="stat-lbl">Uptime</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-val">250+</div>
                            <div className="stat-lbl">Daily Alerts</div>
                        </div>
                    </div>
                </div>

                <div className="landing-preview container animate-up" style={{ animationDelay: '0.2s' }}>
                    <div className="preview-wrap">
                        <img 
                            src="https://images.unsplash.com/photo-1611974717537-483566141973?q=80&w=2000&auto=format&fit=crop" 
                            alt="Dashboard Preview" 
                            className="preview-img"
                        />
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(to bottom, transparent 60%, var(--bg-site))'
                        }}></div>
                    </div>
                </div>
            </section>

            <section className="section container animate-up" style={{ animationDelay: '0.4s' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-12)' }}>
                    <h2 style={{ marginBottom: 'var(--sp-4)' }}>Why Choose Quotra?</h2>
                    <p className="muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Built for modern investors who demand speed, accuracy, and beauty.
                    </p>
                </div>

                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-8)' }}>
                    <div className="glass-card" style={{ padding: 'var(--sp-8)' }}>
                        <div className="g-text" style={{ fontSize: '24px', marginBottom: 'var(--sp-4)' }}>⚡</div>
                        <h3 style={{ fontSize: '18px', marginBottom: 'var(--sp-3)' }}>Real-time Execution</h3>
                        <p className="muted" style={{ fontSize: '14px' }}>Get the latest market data without latency. Our engines process thousands of ticks per second.</p>
                    </div>
                    <div className="glass-card" style={{ padding: 'var(--sp-8)' }}>
                        <div className="g-text" style={{ fontSize: '24px', marginBottom: 'var(--sp-4)' }}>🤖</div>
                        <h3 style={{ fontSize: '18px', marginBottom: 'var(--sp-3)' }}>Smart Alerts</h3>
                        <p className="muted" style={{ fontSize: '14px' }}>Never miss a move. Set custom triggers based on price, volume, or moving averages.</p>
                    </div>
                    <div className="glass-card" style={{ padding: 'var(--sp-8)' }}>
                        <div className="g-text" style={{ fontSize: '24px', marginBottom: 'var(--sp-4)' }}>🔒</div>
                        <h3 style={{ fontSize: '18px', marginBottom: 'var(--sp-3)' }}>Bank-grade Security</h3>
                        <p className="muted" style={{ fontSize: '14px' }}>Your data is encrypted and protected. We use multi-layer security protocols for your peace of mind.</p>
                    </div>
                </div>
            </section>

            <footer className="section container" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--sp-20)', padding: 'var(--sp-12) 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-6)' }}>
                    <div className="nav-logo">
                        <span className="ldot"></span>Quotra
                    </div>
                    <div className="muted" style={{ fontSize: '12px' }}>
                        © 2026 Quotra Financial. All rights reserved. Built with precision.
                    </div>
                    <div className="hero-ctas" style={{ margin: 0, gap: 'var(--sp-6)' }}>
                        <a href="#" className="nav-link" style={{ fontSize: '12px' }}>Privacy</a>
                        <a href="#" className="nav-link" style={{ fontSize: '12px' }}>Terms</a>
                        <a href="#" className="nav-link" style={{ fontSize: '12px' }}>Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
