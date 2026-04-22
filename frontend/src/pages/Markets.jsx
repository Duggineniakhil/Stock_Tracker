import React, { useState, useEffect } from 'react';
import { fetchWatchlist, fetchStockData, addToWatchlist } from '../services/api';
import './Markets.css';

const Markets = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    const loadWatchlist = async () => {
        try {
            const res = await fetchWatchlist();
            setWatchlist(res.data);
        } catch (err) {
            console.error('Error fetching watchlist:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWatchlist();
    }, []);

    const handleSearch = async (e) => {
        const query = e.target.value.toUpperCase();
        setSearchQuery(query);
        
        if (query.length > 1) {
            setSearching(true);
            try {
                const res = await fetchStockData(query);
                setSearchResult(res.data);
            } catch (err) {
                setSearchResult(null);
            } finally {
                setSearching(false);
            }
        } else {
            setSearchResult(null);
        }
    };

    const handleAddToWatchlist = async (symbol) => {
        try {
            await addToWatchlist(symbol);
            setSearchResult(null);
            setSearchQuery('');
            loadWatchlist();
        } catch (err) {
            alert('Failed to add to watchlist');
        }
    };

    if (loading) return <div className="page-loader">Scanning Markets...</div>;

    const defaultStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 189.42, change: 1.24, trend: 'up' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.18, change: -0.87, trend: 'dn' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.40, change: 3.12, trend: 'up' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.90, change: 0.63, trend: 'up' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.55, change: 2.01, trend: 'up' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 183.75, change: -0.44, trend: 'dn' }
    ];

    return (
        <div className="markets-page">
            <header className="hero" style={{ padding: '2rem 0', textAlign: 'left' }}>
                <div className="hbadge"><span className="ldot"></span> Global Equities</div>
                <h1 className="syne" style={{ fontSize: '32px', margin: 0 }}>Market<br /><span className="g-text">Explorer.</span></h1>
            </header>

            <div className="search-bar">
                <input 
                    type="text" 
                    placeholder="Search by symbol (e.g., RELIANCE, MSFT)..." 
                    value={searchQuery}
                    onChange={handleSearch}
                />
                {(searching || searchResult) && (
                    <div className="search-result-card">
                        {searching ? (
                            <div className="muted">Searching...</div>
                        ) : searchResult ? (
                            <>
                                <div>
                                    <div className="syne" style={{ fontWeight: 800 }}>{searchResult.symbol}</div>
                                    <div className="muted" style={{ fontSize: '11px' }}>{searchResult.companyName}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div className="syne" style={{ fontWeight: 700 }}>${searchResult.price?.toFixed(2)}</div>
                                    <button className="bp" onClick={() => handleAddToWatchlist(searchResult.symbol)} style={{ padding: '6px 12px', fontSize: '11px' }}>
                                        + Watchlist
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="muted">No results found</div>
                        )}
                    </div>
                )}
            </div>

            <div className="sec-label">Active Watchlist</div>
            <div className="mkt-grid">
                {[...defaultStocks, ...watchlist.map(w => ({ ...w, trend: w.change >= 0 ? 'up' : 'dn' }))].map((s, i) => (
                    <div className="mkt-card" key={s.id || s.symbol || i}>
                        <div className="mk-header">
                            <div>
                                <div className="mk-symbol">{s.symbol}</div>
                                <div className="mk-name">{s.name || s.companyName || 'Stock Asset'}</div>
                            </div>
                            <div className={`mk-badge ${s.trend}`}>
                                {s.change >= 0 ? '+' : ''}{s.change?.toFixed(2)}%
                            </div>
                        </div>
                        <div className="mk-price">${s.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="sparkline-box">
                            <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                                <path 
                                    d={s.trend === 'up' 
                                        ? "M0,30 C20,28 40,22 60,18 C80,14 100,16 120,10 C140,4 160,6 180,3 L200,2" 
                                        : "M0,5 C20,7 40,10 60,14 C80,18 100,15 120,20 C140,25 160,22 180,28 L200,32"
                                    }
                                    fill="none" 
                                    stroke={s.trend === 'up' ? "#00e887" : "#f05050"} 
                                    strokeWidth="1.5" 
                                />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Markets;
