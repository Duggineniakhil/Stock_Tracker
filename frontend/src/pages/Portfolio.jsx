import React, { useState, useEffect } from 'react';
import { fetchPortfolio, fetchPortfolioAllocation, addHolding, deleteHolding } from '../services/api';
import './Portfolio.css';

const Portfolio = () => {
    const [holdings, setHoldings] = useState([]);
    const [allocation, setAllocation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Simple form state for adding
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
            alert('Failed to add asset');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this holding?')) return;
        try {
            await deleteHolding(id);
            loadData();
        } catch (err) {
            alert('Failed to delete asset');
        }
    };

    if (loading) return <div className="page-loader">Loading Portfolio Details...</div>;

    const COLORS = ['#00e887', '#3882dc', '#f0a500', 'rgba(226,232,244,0.2)'];

    return (
        <div className="portfolio-page">
            <header className="portfolio-header reveal">
                <div>
                    <div className="hbadge"><span className="ldot"></span> Assets & Allocation</div>
                    <h1 className="h1" style={{ margin: 0 }}>Detailed<br /><span className="g-text">Portfolio.</span></h1>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? 'Close' : '+ Add Asset'}
                </button>
            </header>

            {showAddForm && (
                <div className="card reveal" style={{ marginBottom: 'var(--sp-32)' }}>
                    <form className="add-asset-form" onSubmit={handleAdd} style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="small-text">Symbol</label>
                            <input 
                                type="text" 
                                placeholder="AAPL" 
                                required 
                                value={newAsset.symbol} 
                                onChange={e => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})}
                                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '12px', borderRadius: 'var(--radius-btn)' }}
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="small-text">Quantity</label>
                            <input 
                                type="number" 
                                step="any" 
                                placeholder="10" 
                                required 
                                value={newAsset.quantity} 
                                onChange={e => setNewAsset({...newAsset, quantity: e.target.value})} 
                                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '12px', borderRadius: 'var(--radius-btn)' }}
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="small-text">Buy Price</label>
                            <input 
                                type="number" 
                                step="any" 
                                placeholder="150.00" 
                                required 
                                value={newAsset.buyPrice} 
                                onChange={e => setNewAsset({...newAsset, buyPrice: e.target.value})} 
                                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '12px', borderRadius: 'var(--radius-btn)' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Add Asset</button>
                    </form>
                </div>
            )}

            <div className="portfolio-grid">
                <div className="holdings-section">
                    <div className="sec-label">My Holdings</div>
                    {holdings.length > 0 ? holdings.map((h, i) => (
                        <div className="holding-item" key={h._id || i}>
                            <div className="h-brand">
                                <div className="h-icon-box">{h.symbol.substring(0, 2)}</div>
                                <div>
                                    <div className="h-meta-name">{h.symbol}</div>
                                    <div className="h-meta-qty">{h.quantity} shares @ ${h.buyPrice?.toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="h-data">
                                <div className="h-price">${(h.currentPrice * h.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div className={`h-change ${h.change >= 0 ? 'up' : 'dn'}`}>
                                    {h.change >= 0 ? '+' : ''}{h.changePercent?.toFixed(2)}%
                                </div>
                                <button onClick={() => handleDelete(h._id)} style={{ fontSize: '10px', color: '#f05050', marginTop: '4px' }}>Remove</button>
                            </div>
                        </div>
                    )) : (
                        <div className="card muted" style={{ textAlign: 'center', padding: 'var(--sp-48)' }}>
                            Your portfolio is currently empty.
                        </div>
                    )}
                </div>

                <div className="card allocation-card reveal">
                    <div className="allocation-title h2" style={{ fontSize: '18px' }}>
                        Current Allocation
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-green)', fontFamily: 'DM Sans' }}>Real-time</span>
                    </div>
                    <div className="alloc-list">
                        {allocation.length > 0 ? allocation.map((a, i) => (
                            <div className="alloc-item" key={i}>
                                <div className="alloc-info">
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.symbol}</span>
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
                            <div className="muted" style={{ fontSize: '12px', textAlign: 'center' }}>No data available</div>
                        )}
                    </div>
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0, 232, 135, 0.05)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700, marginBottom: '4px' }}>STRATEGY TIP</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            High concentration in {allocation[0]?.symbol || 'one asset'} detected. Consider diversifying to reduce risk.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Portfolio;
