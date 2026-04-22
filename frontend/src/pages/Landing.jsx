import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import './Landing.css';

const Landing = () => {
    const { user } = useAuth();
    const [openFaq, setOpenFaq] = useState(0);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="landing-site site">
            <Navbar />

            <div className="tick">
                <div className="tick-inner">
                    <div className="ti"><span className="ts">AAPL</span> $189.42 <span className="up">+1.24%</span></div>
                    <div className="ti"><span className="ts">TSLA</span> $242.18 <span className="dn">-0.87%</span></div>
                    <div className="ti"><span className="ts">GOOGL</span> $141.55 <span className="up">+2.01%</span></div>
                    <div className="ti"><span className="ts">MSFT</span> $378.90 <span className="up">+0.63%</span></div>
                    <div className="ti"><span className="ts">NVDA</span> $875.40 <span className="up">+3.12%</span></div>
                    <div className="ti"><span className="ts">AMZN</span> $183.75 <span className="dn">-0.44%</span></div>
                    <div className="ti"><span className="ts">META</span> $512.30 <span className="up">+1.88%</span></div>
                    <div className="ti"><span className="ts">NFLX</span> $628.90 <span className="dn">-1.10%</span></div>
                    <div className="ti"><span className="ts">RELIANCE</span> ₹2,841 <span className="up">+0.92%</span></div>
                    <div className="ti"><span className="ts">TCS</span> ₹3,920 <span className="up">+1.45%</span></div>
                    <div className="ti"><span className="ts">AAPL</span> $189.42 <span className="up">+1.24%</span></div>
                    <div className="ti"><span className="ts">TSLA</span> $242.18 <span className="dn">-0.87%</span></div>
                    <div className="ti"><span className="ts">GOOGL</span> $141.55 <span className="up">+2.01%</span></div>
                    <div className="ti"><span className="ts">MSFT</span> $378.90 <span className="up">+0.63%</span></div>
                    <div className="ti"><span className="ts">NVDA</span> $875.40 <span className="up">+3.12%</span></div>
                    <div className="ti"><span className="ts">AMZN</span> $183.75 <span className="dn">-0.44%</span></div>
                    <div className="ti"><span className="ts">META</span> $512.30 <span className="up">+1.88%</span></div>
                    <div className="ti"><span className="ts">NFLX</span> $628.90 <span className="dn">-1.10%</span></div>
                    <div className="ti"><span className="ts">RELIANCE</span> ₹2,841 <span className="up">+0.92%</span></div>
                    <div className="ti"><span className="ts">TCS</span> ₹3,920 <span className="up">+1.45%</span></div>
                </div>
            </div>

            <main className="container">
                <section className="hero reveal">
                    <div className="hero-content">
                        <div className="hbadge"><span className="ldot"></span> Live quotes for 10,000+ stocks</div>
                        <h1 className="h1">The Market,<br /><span className="g-text">Simplified.</span></h1>
                        <p>Live quotes, portfolio tracking, and real-time insights — built for everyday investors who want clarity, not complexity.</p>
                        
                        <div className="hero-btns">
                            {user ? (
                                <Link to="/dashboard" className="btn btn-primary">Go to Portfolio</Link>
                            ) : (
                                <Link to="/register" className="btn btn-primary">Start tracking free</Link>
                            )}
                            <a href="#how-it-works" className="btn btn-secondary">See how it works</a>
                        </div>
                        
                        <div className="hero-stats">
                            <div><div className="hstat-val">50K+</div><div className="hstat-lbl">Active investors</div></div>
                            <div><div className="hstat-val">10K+</div><div className="hstat-lbl">Stocks tracked</div></div>
                            <div><div className="hstat-val">Real-time</div><div className="hstat-lbl">Market data</div></div>
                        </div>
                    </div>
                </section>

                <hr className="sep reveal" />

                <section className="section reveal" id="how-it-works">
                    <div className="section-header">
                        <div className="hbadge" style={{ marginBottom: 'var(--sp-16)' }}>How it works</div>
                        <h2 className="h2">Investing made simple,<br />in three steps.</h2>
                        <p className="muted">No financial jargon. No confusing charts. Just clear data and smart tools that help you stay on top of your money.</p>
                    </div>
                    
                    <div className="grid-3">
                        <div className="card step-card">
                            <div className="step-num">01</div>
                            <h3 className="h2" style={{ fontSize: '18px', marginBottom: '8px' }}>Create your account</h3>
                            <p className="muted">Sign up in under 60 seconds. No credit card, no paperwork. Just your email and you're in.</p>
                        </div>
                        <div className="card step-card">
                            <div className="step-num">02</div>
                            <h3 className="h2" style={{ fontSize: '18px', marginBottom: '8px' }}>Build your watchlist</h3>
                            <p className="muted">Search any stock, ETF, or index. Add it to your watchlist and start tracking it live.</p>
                        </div>
                        <div className="card step-card">
                            <div className="step-num">03</div>
                            <h3 className="h2" style={{ fontSize: '18px', marginBottom: '8px' }}>Track & stay sharp</h3>
                            <p className="muted">Get real-time prices, portfolio changes, and smart alerts sent straight to you.</p>
                        </div>
                    </div>
                </section>

                <hr className="sep reveal" />

                <section className="section reveal">
                    <div className="section-header">
                        <div className="hbadge" style={{ marginBottom: 'var(--sp-16)' }}>Features</div>
                        <h2 className="h2">Everything you need.<br />Nothing you don't.</h2>
                    </div>
                    
                    <div className="grid-3">
                        <div className="card">
                            <h3 className="h2" style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--accent-green)' }}>◎ Live quotes</h3>
                            <p className="muted" style={{ fontSize: '14px' }}>Real-time prices from NSE, BSE, NYSE, NASDAQ and more.</p>
                        </div>
                        <div className="card">
                            <h3 className="h2" style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--accent-green)' }}>▦ Portfolio tracker</h3>
                            <p className="muted" style={{ fontSize: '14px' }}>Track P&L, allocation, and performance across all holdings.</p>
                        </div>
                        <div className="card">
                            <h3 className="h2" style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--accent-green)' }}>⌖ Smart alerts</h3>
                            <p className="muted" style={{ fontSize: '14px' }}>Get notified when your stocks hit a price you care about.</p>
                        </div>
                        <div className="card">
                            <h3 className="h2" style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--accent-green)' }}>◈ Market insights</h3>
                            <p className="muted" style={{ fontSize: '14px' }}>Plain-language analysis on trends, signals, and movements.</p>
                        </div>
                        <div className="card">
                            <h3 className="h2" style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--accent-green)' }}>⊞ Watchlists</h3>
                            <p className="muted" style={{ fontSize: '14px' }}>Organize stocks into groups — tech, dividend, growth — your way.</p>
                        </div>
                        <div className="card">
                            <h3 className="h2" style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--accent-green)' }}>◷ Historical data</h3>
                            <p className="muted" style={{ fontSize: '14px' }}>View up to 10 years of price history with clean, readable charts.</p>
                        </div>
                    </div>
                </section>

                <hr className="sep reveal" />

                <section className="section reveal" style={{ paddingBottom: 'var(--sp-64)' }}>
                    <div className="section-header" style={{ margin: '0 auto', textAlign: 'center' }}>
                        <h2 className="h2">Questions? We've got answers.</h2>
                    </div>
                    
                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                        {[
                            { q: "Is Quotra free to use?", a: "Yes — Quotra has a generous free plan that covers real-time quotes, a portfolio tracker, and basic watchlists. A Pro plan unlocks advanced insights, alerts, and extended history." },
                            { q: "Do I need to connect my broker?", a: "No. Quotra is a tracking and insights tool — you manually enter your holdings. We don't connect to your brokerage or execute any trades." },
                            { q: "Which markets does Quotra cover?", a: "We cover NSE, BSE, NYSE, NASDAQ, and several global exchanges. We're adding more markets every quarter based on user requests." },
                            { q: "How real-time is the data?", a: "Free plan data is delayed by 15 minutes. Pro plan users get live, sub-second price updates during market hours." },
                            { q: "Is my data safe?", a: "Absolutely. We don't store any financial credentials. Your portfolio data is encrypted and never shared with third parties." }
                        ].map((faq, idx) => (
                            <div 
                                key={idx}
                                className="card" 
                                style={{ marginBottom: 'var(--sp-16)', cursor: 'pointer' }}
                                onClick={() => toggleFaq(idx)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 className="body-text" style={{ fontWeight: 700 }}>{faq.q}</h3>
                                    <span style={{ 
                                        color: 'var(--accent-green)', 
                                        transform: openFaq === idx ? 'rotate(45deg)' : 'none',
                                        transition: 'var(--transition-base)',
                                        fontSize: '20px',
                                        lineHeight: 1
                                    }}>+</span>
                                </div>
                                {openFaq === idx && (
                                    <p className="muted" style={{ marginTop: 'var(--sp-16)', fontSize: '14px' }}>{faq.a}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: 'var(--sp-48) 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div className="logo" style={{ justifyContent: 'center', marginBottom: 'var(--sp-16)' }}>
                        <span className="ldot"></span>Quotra
                    </div>
                    <p className="small-text">© 2026 Quotra. All rights reserved. Quote it. Track it. Own it.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
