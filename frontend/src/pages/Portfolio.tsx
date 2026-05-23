import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPortfolio, fetchPortfolioAllocation, addHolding, deleteHolding } from '../services/api';
import { Chart, registerables } from 'chart.js';
import './Portfolio.css';

Chart.register(...registerables);

const Portfolio = () => {
    const navigate = useNavigate();
    const [holdings, setHoldings] = useState([]);
    const [allocation, setAllocation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);
    
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

    useEffect(() => {
        if (allocation.length > 0 && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: allocation.map(a => a.symbol),
                    datasets: [{
                        data: allocation.map(a => a.percentage),
                        backgroundColor: COLORS,
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    cutout: '75%',
                    plugins: {
                        legend: { display: false }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }, [allocation]);

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

    const handleExport = () => {
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_URL}/api/v1/portfolio/export/csv?token=${token}`;
        window.open(url, '_blank');
    };

    return (
        <div className="portfolio-page">
            <header className="portfolio-header reveal">
                <div>
                    <div className="hbadge"><span className="ldot"></span> Assets & Allocation</div>
                    <h1 className="h1" style={{ margin: 0 }}>Detailed<br /><span className="g-text">Portfolio.</span></h1>
                </div>
                <div className="portfolio-actions">
                    <button className="btn btn-outline" onClick={handleExport} style={{ marginRight: 'var(--sp-12)' }}>
                        Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? 'Close' : '+ Add Asset'}
                    </button>
                </div>
            </header>

            {showAddForm && (
                <div className="card reveal add-card">
                    <form className="add-asset-form" onSubmit={handleAdd}>
                        <div className="input-group">
                            <label>Symbol</label>
                            <input 
                                type="text" 
                                placeholder="AAPL" 
                                required 
                                value={newAsset.symbol} 
                                onChange={e => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="input-group">
                            <label>Quantity</label>
                            <input 
                                type="number" 
                                step="any" 
                                placeholder="10" 
                                required 
                                value={newAsset.quantity} 
                                onChange={e => setNewAsset({...newAsset, quantity: e.target.value})} 
                            />
                        </div>
                        <div className="input-group">
                            <label>Buy Price</label>
                            <input 
                                type="number" 
                                step="any" 
                                placeholder="150.00" 
                                required 
                                value={newAsset.buyPrice} 
                                onChange={e => setNewAsset({...newAsset, buyPrice: e.target.value})} 
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
                        <div 
                            className="holding-item clickable" 
                            key={h._id || i}
                            onClick={() => navigate(`/stock/${h.symbol}`)}
                        >
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
                                <button className="h-del" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(h._id);
                                }}>Remove</button>
                            </div>
                        </div>
                    )) : (
                        <div className="card muted" style={{ textAlign: 'center', padding: 'var(--sp-48)' }}>
                            Your portfolio is currently empty.
                        </div>
                    )}
                </div>

                <div className="card allocation-card reveal">
                    <div className="allocation-title h2">
                        Current Allocation
                        <span className="small-text accent">Real-time</span>
                    </div>
                    <div className="alloc-chart-box">
                        <canvas ref={chartRef}></canvas>
                        <div className="alloc-center-val">
                            <span className="small-text muted">ASSETS</span>
                            <span className="syne h3">{allocation.length}</span>
                        </div>
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
                            <div className="muted small-text" style={{ textAlign: 'center' }}>No data available</div>
                        )}
                    </div>
                    <div className="strategy-card">
                        <div className="strat-lbl">STRATEGY TIP</div>
                        <div className="strat-body">
                            High concentration in {allocation[0]?.symbol || 'one asset'} detected. Consider diversifying to reduce risk.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Portfolio;
