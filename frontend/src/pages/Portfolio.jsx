import React, { useState, useEffect } from 'react';
import { fetchPortfolio, fetchPortfolioAllocation, addHolding, deleteHolding } from '../services/api';
import './Portfolio.css';

const Portfolio = () => {
    const [holdings, setHoldings] = useState([]);
    const [allocation, setAllocation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [newAsset, setNewAsset] = useState({ symbol: '', quantity: '', buyPrice: '' });

    const loadData = async () => {
        try {
            const [pRes, aRes] = await Promise.all([
                fetchPortfolio(),
                fetchPortfolioAllocation()
            ]);
            setHoldings(pRes.data);
            setAllocation(aRes.data);
        } catch (err) {
            console.error('Error loading portfolio:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addHolding(newAsset.symbol, parseFloat(newAsset.quantity), parseFloat(newAsset.buyPrice), new Date().toISOString());
            setNewAsset({ symbol: '', quantity: '', buyPrice: '' });
            setShowAddForm(false);
            loadData();
        } catch (err) {
            console.error('Failed to add asset', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this holding?')) return;
        try {
            await deleteHolding(id);
            loadData();
        } catch (err) {
            console.error('Failed to delete asset', err);
        }
    };

    if (loading) return <div className="page-loader"><span className="animate-up">PORTFOLIO...</span></div>;

    const COLORS = ['var(--accent-green)', 'var(--market-blue)', 'var(--market-yellow)', 'var(--text-dim)'];

    return (
        <div className="portfolio-page container">
            <header className="dashboard-header animate-up">
                <div className="hbadge"><span className="ldot"></span> Assets & Allocation</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
                    <h1>Detailed<br /><span className="g-text">Portfolio.</span></h1>
                    <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? 'Close' : '+ Add Asset'}
                    </button>
                </div>
            </header>

            {showAddForm && (
                <div className="glass-card animate-up" style={{ padding: 'var(--sp-8)', marginBottom: 'var(--sp-12)' }}>
                    <form className="auth-form" onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-6)', alignItems: 'flex-end' }}>
                        <div className="input-group">
                            <label>Symbol</label>
                            <input type="text" placeholder="AAPL" required value={newAsset.symbol} onChange={e => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="input-group">
                            <label>Quantity</label>
                            <input type="number" step="any" placeholder="10" required value={newAsset.quantity} onChange={e => setNewAsset({...newAsset, quantity: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Buy Price</label>
                            <input type="number" step="any" placeholder="150.00" required value={newAsset.buyPrice} onChange={e => setNewAsset({...newAsset, buyPrice: e.target.value})} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '48px' }}>Add Holding</button>
                    </form>
                </div>
            )}

            <div className="portfolio-layout animate-up" style={{ animationDelay: '0.1s' }}>
                <div className="holdings-column">
                    <div className="sec-label" style={{ marginBottom: 'var(--sp-4)' }}>My Holdings</div>
                    <div className="holdings-list">
                        {holdings.length > 0 ? holdings.map((h, i) => (
                            <div className="glass-card holding-item-large" key={h._id || i}>
                                <div className="holding-main">
                                    <div className="holding-icon">{h.symbol.substring(0, 2)}</div>
                                    <div className="holding-name">
                                        <span className="holding-symbol">{h.symbol}</span>
                                        <span className="holding-shares">{h.quantity} shares @ ${h.buyPrice?.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="holding-stats">
                                    <div className="holding-px">${(h.currentPrice * h.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div className={`holding-ch ${h.change >= 0 ? 'up' : 'down'}`}>
                                        {h.change >= 0 ? '+' : ''}{h.changePercent?.toFixed(2)}%
                                    </div>
                                    <button onClick={() => handleDelete(h._id)} className="btn-remove">Remove</button>
                                </div>
                            </div>
                        )) : (
                            <div className="glass-card muted" style={{ padding: '4rem', textAlign: 'center' }}>
                                Your portfolio is currently empty. Start by adding an asset.
                            </div>
                        )}
                    </div>
                </div>

                <div className="side-panel">
                    <div className="glass-card allocation-card">
                        <div className="allocation-title syne">
                            Asset Allocation
                            <span className="status-badge">Real-time</span>
                        </div>
                        <div className="alloc-list">
                            {allocation.length > 0 ? allocation.map((a, i) => (
                                <div className="alloc-item" key={i}>
                                    <div className="alloc-info">
                                        <span className="syne" style={{ fontWeight: 700 }}>{a.symbol}</span>
                                        <span className="muted">{a.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="alloc-bar-bg">
                                        <div 
                                            className="alloc-bar-fill" 
                                            style={{ 
                                                width: `${a.percentage}%`, 
                                                background: COLORS[i % COLORS.length] 
                                            }} 
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="muted" style={{ textAlign: 'center', fontSize: '13px' }}>No data available</div>
                            )}
                        </div>
                        {allocation.length > 0 && (
                            <div className="strategy-card">
                                <div className="strategy-label">STRATEGY TIP</div>
                                <div className="strategy-text">
                                    {allocation[0]?.percentage > 50 
                                        ? `High concentration in ${allocation[0].symbol} detected. Consider diversifying to reduce risk.`
                                        : "Your portfolio distribution looks healthy. Continue monitoring for rebalancing opportunities."}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Portfolio;
