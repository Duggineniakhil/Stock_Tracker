import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const Landing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(0);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="site">
            <nav className="nav">
                <div className="logo"><span className="ldot"></span>Quotra</div>
                <ul className="nl">
                    <li><Link to="/markets">Markets</Link></li>
                    <li><Link to="/portfolio">Portfolio</Link></li>
                    <li><Link to="/insights">Insights</Link></li>
                    <li><a href="#">Pricing</a></li>
                </ul>
                {user ? (
                    <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                        <button className="ncta">Dashboard</button>
                    </Link>
                ) : (
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <button className="ncta">Get started free</button>
                    </Link>
                )}
            </nav>

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

            <div className="hero">
                <div className="hbadge"><span className="ldot"></span> Live quotes for 10,000+ stocks</div>
                <h1 className="sy">The Market,<br /><span className="g">Simplified.</span></h1>
                <p>Live quotes, portfolio tracking, and real-time insights — built for everyday investors who want clarity, not complexity.</p>
                <div className="hbtns">
                    {user ? (
                        <Link to="/dashboard" className="bp">Go to Portfolio</Link>
                    ) : (
                        <Link to="/register" className="bp">Start tracking free</Link>
                    )}
                    <a href="#how-it-works" className="bg">See how it works</a>
                </div>
                <div className="hstats">
                    <div><div className="hstat-val">50K+</div><div className="hstat-lbl">Active investors</div></div>
                    <div style={{ width: '0.5px', background: 'rgba(255,255,255,0.08)' }}></div>
                    <div><div className="hstat-val">10K+</div><div className="hstat-lbl">Stocks tracked</div></div>
                    <div style={{ width: '0.5px', background: 'rgba(255,255,255,0.08)' }}></div>
                    <div><div className="hstat-val">Real-time</div><div className="hstat-lbl">Market data</div></div>
                </div>
                <div className="db-wrap">
                    <div className="db-bar">
                        <div className="dots"><div className="dot" style={{ background: '#f05050' }}></div><div className="dot" style={{ background: '#f0a500' }}></div><div className="dot" style={{ background: '#00e887' }}></div></div>
                        <span style={{ fontSize: '11px', color: 'rgba(226,232,244,0.3)' }}>quotra — dashboard</span>
                        <div style={{ width: '46px' }}></div>
                    </div>
                    <div className="db-body">
                        <div className="db-top">
                            <div>
                                <div className="bal-lbl">Total portfolio</div>
                                <div className="bal-val">$84,293 <span style={{ fontSize: '13px', color: '#00e887', fontFamily: "'DM Sans'" }}>+4.7%</span></div>
                            </div>
                            <div className="tabs">
                                <button className="tab">1D</button><button className="tab">1W</button><button className="tab a">1M</button><button className="tab">1Y</button>
                            </div>
                        </div>
                        <div className="chart-box">
                            <svg viewBox="0 0 590 80" preserveAspectRatio="none">
                                <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e887" stopOpacity=".15" /><stop offset="100%" stopColor="#00e887" stopOpacity="0" /></linearGradient></defs>
                                <path d="M0,70 C25,66 45,62 75,54 C105,46 120,50 150,42 C180,34 200,38 230,28 C260,18 280,24 310,16 C340,8 360,13 390,8 C420,3 450,6 480,4 C510,2 550,5 590,2 L590,80 L0,80Z" fill="url(#cg)" />
                                <path d="M0,70 C25,66 45,62 75,54 C105,46 120,50 150,42 C180,34 200,38 230,28 C260,18 280,24 310,16 C340,8 360,13 390,8 C420,3 450,6 480,4 C510,2 550,5 590,2" fill="none" stroke="#00e887" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <div className="scards">
                            <div className="sc"><div className="sc-sym">AAPL</div><div className="sc-nm">Apple Inc.</div><div className="sc-px">$189.42</div><div className="sc-ch up">+1.24%</div></div>
                            <div className="sc"><div className="sc-sym">NVDA</div><div className="sc-nm">NVIDIA Corp.</div><div className="sc-px">$875.40</div><div className="sc-ch up">+3.12%</div></div>
                            <div className="sc"><div className="sc-sym">TSLA</div><div className="sc-nm">Tesla Inc.</div><div className="sc-px">$242.18</div><div className="sc-ch dn">-0.87%</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="sep" />

            <div className="sec hiw" id="how-it-works">
                <div style={{ maxWidth: '620px', margin: '0 auto' }}>
                    <div className="sec-label">How it works</div>
                    <div className="sec-h">Investing made simple,<br />in three steps.</div>
                    <div className="sec-sub">No financial jargon. No confusing charts. Just clear data and smart tools that help you stay on top of your money.</div>
                    <div className="steps">
                        <div className="step"><div className="step-num">01</div><div className="step-title">Create your account</div><div className="step-desc">Sign up in under 60 seconds. No credit card, no paperwork. Just your email and you're in.</div></div>
                        <div className="step"><div className="step-num">02</div><div className="step-title">Build your watchlist</div><div className="step-desc">Search any stock, ETF, or index. Add it to your watchlist and start tracking it live.</div></div>
                        <div className="step"><div className="step-num">03</div><div className="step-title">Track & stay sharp</div><div className="step-desc">Get real-time prices, portfolio changes, and smart alerts sent straight to you.</div></div>
                    </div>
                </div>
            </div>

            <hr className="sep" />

            <div className="sec port">
                <div style={{ maxWidth: '620px', margin: '0 auto' }}>
                    <div className="sec-label">Portfolio</div>
                    <div className="sec-h">Your entire portfolio,<br />one clean view.</div>
                    <div className="sec-sub">Track every holding, see your gains and losses, and understand where your money is allocated — all in one place.</div>
                    <div className="port-grid">
                        <div className="port-card">
                            <div className="pc-label">Total value</div>
                            <div className="pc-val">$84,293.40</div>
                            <div className="pc-chg up">+$3,821.10 today (+4.74%)</div>
                            <div className="alloc" style={{ marginTop: '1.2rem' }}>
                                <div style={{ fontSize: '10px', color: 'rgba(226,232,244,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Allocation</div>
                                <div className="alloc-row"><span className="alloc-sym">AAPL</span><div className="alloc-bar-wrap"><div className="alloc-bar" style={{ width: '38%', background: '#00e887' }}></div></div><span className="alloc-pct">38%</span></div>
                                <div className="alloc-row"><span className="alloc-sym">NVDA</span><div className="alloc-bar-wrap"><div className="alloc-bar" style={{ width: '27%', background: '#3882dc' }}></div></div><span className="alloc-pct">27%</span></div>
                                <div className="alloc-row"><span className="alloc-sym">TSLA</span><div className="alloc-bar-wrap"><div className="alloc-bar" style={{ width: '20%', background: '#f0a500' }}></div></div><span className="alloc-pct">20%</span></div>
                                <div className="alloc-row"><span className="alloc-sym">Others</span><div className="alloc-bar-wrap"><div className="alloc-bar" style={{ width: '15%', background: 'rgba(226,232,244,0.2)' }}></div></div><span className="alloc-pct">15%</span></div>
                            </div>
                        </div>
                        <div className="port-right">
                            <div className="holding"><div className="h-left"><div className="h-icon">AA</div><div><div className="h-sym">AAPL</div><div className="h-nm">12 shares</div></div></div><div><div className="h-px">$2,273.04</div><div className="h-ch up">+$28.20</div></div></div>
                            <div className="holding"><div className="h-left"><div className="h-icon" style={{ background: 'rgba(56,130,220,0.1)', color: '#3882dc' }}>NV</div><div><div className="h-sym">NVDA</div><div className="h-nm">3 shares</div></div></div><div><div className="h-px">$2,626.20</div><div className="h-ch up">+$79.60</div></div></div>
                            <div className="holding"><div className="h-left"><div className="h-icon" style={{ background: 'rgba(240,80,80,0.1)', color: '#f05050' }}>TS</div><div><div className="h-sym">TSLA</div><div className="h-nm">8 shares</div></div></div><div><div className="h-px">$1,937.44</div><div className="h-ch dn">-$16.82</div></div></div>
                            <div className="holding"><div className="h-left"><div className="h-icon" style={{ background: 'rgba(240,165,0,0.1)', color: '#f0a500' }}>MS</div><div><div className="h-sym">MSFT</div><div className="h-nm">5 shares</div></div></div><div><div className="h-px">$1,894.50</div><div className="h-ch up">+$11.90</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="sep" />

            <div className="sec mkt">
                <div style={{ maxWidth: '620px', margin: '0 auto' }}>
                    <div className="sec-label">Market</div>
                    <div className="sec-h">Markets at a glance.</div>
                    <div className="sec-sub">Follow the stocks that matter to you. Real-time prices with mini trend charts so you always know the direction.</div>
                    <div className="mkt-grid">
                        <div className="mkt-card">
                            <div className="mk-top"><div><div className="mk-sym">AAPL</div><div className="mk-nm">Apple Inc. · NASDAQ</div></div><div className="mk-badge up">+1.24%</div></div>
                            <div className="mk-px">$189.42</div>
                            <svg className="spark" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0,30 C20,28 40,22 60,18 C80,14 100,16 120,10 C140,4 160,6 180,3 L200,2" fill="none" stroke="#00e887" strokeWidth="1.5" /></svg>
                        </div>
                        <div className="mkt-card">
                            <div className="mk-top"><div><div className="mk-sym">TSLA</div><div className="mk-nm">Tesla Inc. · NASDAQ</div></div><div className="mk-badge dn">-0.87%</div></div>
                            <div className="mk-px">$242.18</div>
                            <svg className="spark" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0,5 C20,7 40,10 60,14 C80,18 100,15 120,20 C140,25 160,22 180,28 L200,32" fill="none" stroke="#f05050" strokeWidth="1.5" /></svg>
                        </div>
                        <div className="mkt-card">
                            <div className="mk-top"><div><div className="mk-sym">NVDA</div><div className="mk-nm">NVIDIA Corp. · NASDAQ</div></div><div className="mk-badge up">+3.12%</div></div>
                            <div className="mk-px">$875.40</div>
                            <svg className="spark" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0,35 C20,30 40,24 60,18 C80,12 100,15 120,8 C140,2 160,4 180,2 L200,1" fill="none" stroke="#00e887" strokeWidth="1.5" /></svg>
                        </div>
                        <div className="mkt-card">
                            <div className="mk-top"><div><div className="mk-sym">RELIANCE</div><div className="mk-nm">Reliance Ind. · NSE</div></div><div className="mk-badge up">+0.92%</div></div>
                            <div className="mk-px">₹2,841</div>
                            <svg className="spark" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0,28 C20,25 40,22 60,19 C80,16 100,18 120,13 C140,8 160,10 180,6 L200,5" fill="none" stroke="#00e887" strokeWidth="1.5" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="sep" />

            <div className="sec ins">
                <div style={{ maxWidth: '620px', margin: '0 auto' }}>
                    <div className="sec-label">Insights</div>
                    <div className="sec-h">Smart signals for<br />smarter decisions.</div>
                    <div className="sec-sub">Quotra reads the market so you don't have to. Get plain-language insights on what's moving and why.</div>
                    <div className="ins-grid">
                        <div className="ins-card"><div className="ins-tag tag-bull">Bullish signal</div><div className="ins-title">NVDA breaks resistance at $860 — momentum building</div><div className="ins-body">NVIDIA crossed its 50-day moving average on strong volume. Analysts see potential upside toward the $920 range over the next 2 weeks.</div><div className="ins-meta">Today · 2 min read</div></div>
                        <div className="ins-card"><div className="ins-tag tag-warn">Watch closely</div><div className="ins-title">TSLA dips ahead of earnings — volatility expected</div><div className="ins-body">Tesla reports earnings next week. Historical data shows 8–12% swings post-announcement. Consider your position size carefully.</div><div className="ins-meta">Today · 3 min read</div></div>
                        <div className="ins-card"><div className="ins-tag tag-info">Market update</div><div className="ins-title">Fed holds rates steady — tech stocks react positively</div><div className="ins-body">The Federal Reserve kept interest rates unchanged, providing relief to growth stocks. NASDAQ gained 1.8% on the news.</div><div className="ins-meta">Yesterday · 2 min read</div></div>
                        <div className="ins-card"><div className="ins-tag tag-neu">Sector spotlight</div><div className="ins-title">Indian IT stocks quietly outperforming in April</div><div className="ins-body">TCS, Infosys, and Wipro are all up 4–7% this month as global demand for IT services remains strong heading into Q2.</div><div className="ins-meta">2 days ago · 2 min read</div></div>
                    </div>
                </div>
            </div>

            <hr className="sep" />

            <div className="sec feat">
                <div style={{ maxWidth: '620px', margin: '0 auto' }}>
                    <div className="sec-label">Features</div>
                    <div className="sec-h">Everything you need.<br />Nothing you don't.</div>
                    <div className="feat-grid">
                        <div className="fc"><div className="fc-icon">◎</div><div className="fc-t">Live quotes</div><div className="fc-d">Real-time prices from NSE, BSE, NYSE, NASDAQ and more.</div></div>
                        <div className="fc"><div className="fc-icon">▦</div><div className="fc-t">Portfolio tracker</div><div className="fc-d">Track P&L, allocation, and performance across all holdings.</div></div>
                        <div className="fc"><div className="fc-icon">⌖</div><div className="fc-t">Smart alerts</div><div className="fc-d">Get notified when your stocks hit a price you care about.</div></div>
                        <div className="fc"><div className="fc-icon">◈</div><div className="fc-t">Market insights</div><div className="fc-d">Plain-language analysis on trends, signals, and movements.</div></div>
                        <div className="fc"><div className="fc-icon">⊞</div><div className="fc-t">Watchlists</div><div className="fc-d">Organize stocks into groups — tech, dividend, growth — your way.</div></div>
                        <div className="fc"><div className="fc-icon">◷</div><div className="fc-t">Historical data</div><div className="fc-d">View up to 10 years of price history with clean, readable charts.</div></div>
                    </div>
                </div>
            </div>

            <hr className="sep" />

            <div className="sec faq">
                <div style={{ maxWidth: '620px', margin: '0 auto' }}>
                    <div className="sec-label">FAQ</div>
                    <div className="sec-h">Questions? We've got answers.</div>
                    <div className="faq-list">
                        <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`}>
                            <div className="faq-q" onClick={() => toggleFaq(0)}>Is Quotra free to use? <span className="faq-arrow">+</span></div>
                            <div className="faq-a">Yes — Quotra has a generous free plan that covers real-time quotes, a portfolio tracker, and basic watchlists. A Pro plan unlocks advanced insights, alerts, and extended history.</div>
                        </div>
                        <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`}>
                            <div className="faq-q" onClick={() => toggleFaq(1)}>Do I need to connect my broker? <span className="faq-arrow">+</span></div>
                            <div className="faq-a">No. Quotra is a tracking and insights tool — you manually enter your holdings. We don't connect to your brokerage or execute any trades.</div>
                        </div>
                        <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`}>
                            <div className="faq-q" onClick={() => toggleFaq(2)}>Which markets does Quotra cover? <span className="faq-arrow">+</span></div>
                            <div className="faq-a">We cover NSE, BSE, NYSE, NASDAQ, and several global exchanges. We're adding more markets every quarter based on user requests.</div>
                        </div>
                        <div className={`faq-item ${openFaq === 3 ? 'open' : ''}`}>
                            <div className="faq-q" onClick={() => toggleFaq(3)}>How real-time is the data? <span className="faq-arrow">+</span></div>
                            <div className="faq-a">Free plan data is delayed by 15 minutes. Pro plan users get live, sub-second price updates during market hours.</div>
                        </div>
                        <div className={`faq-item ${openFaq === 4 ? 'open' : ''}`}>
                            <div className="faq-q" onClick={() => toggleFaq(4)}>Is my data safe? <span className="faq-arrow">+</span></div>
                            <div className="faq-a">Absolutely. We don't store any financial credentials. Your portfolio data is encrypted and never shared with third parties.</div>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="sep" />

            <div className="footer">
                <div className="ft-grid">
                    <div>
                        <div className="ft-brand"><span className="ldot"></span>Quotra</div>
                        <div className="ft-desc">A simple, reliable platform for tracking stocks and managing investments in real time.</div>
                    </div>
                    <div>
                        <div className="ft-col-h">Product</div>
                        <ul className="ft-links"><li><a href="#">Markets</a></li><li><a href="#">Portfolio</a></li><li><a href="#">Insights</a></li><li><a href="#">Alerts</a></li><li><a href="#">Pricing</a></li></ul>
                    </div>
                    <div>
                        <div className="ft-col-h">Company</div>
                        <ul className="ft-links"><li><a href="#">About</a></li><li><a href="#">Blog</a></li><li><a href="#">Careers</a></li><li><a href="#">Press</a></li></ul>
                    </div>
                    <div>
                        <div className="ft-col-h">Legal</div>
                        <ul className="ft-links"><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li><li><a href="#">Disclaimer</a></li></ul>
                    </div>
                </div>
                <div className="ft-bottom">
                    <div className="ft-copy">© 2025 Quotra. All rights reserved.</div>
                    <div className="ft-tagline">Quote it. Track it. Own it.</div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
