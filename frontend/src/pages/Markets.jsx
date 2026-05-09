import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWatchlist, fetchStockData, addToWatchlist } from '../services/api';
import SentimentBadge from '../components/ai/SentimentBadge';
import Sparkline from '../components/Sparkline';
import './Markets.css';

const Markets = () => {
    const navigate = useNavigate();
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
            <header className="reveal" style={{ paddingTop: 'var(--sp-48)', paddingBottom: 'var(--sp-32)' }}>
                <div className="hbadge"><span className="ldot"></span> Global Equities</div>
                <h1 className="h1" style={{ margin: 0 }}>Market<br /><span className="g-text">Explorer.</span></h1>
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
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>{searchResult.symbol}</div>
                                    <div className="small-text">{searchResult.name || searchResult.companyName}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--sp-16)', alignItems: 'center' }}>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>${(searchResult.currentPrice || searchResult.price)?.toFixed(2)}</div>
                                    <button className="btn btn-primary" style={{ height: '36px', padding: '0 var(--sp-16)', fontSize: '12px' }} onClick={() => handleAddToWatchlist(searchResult.symbol)}>
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
                    <div 
                        className="card clickable" 
                        key={s.id || s.symbol || i} 
                        style={{ padding: 'var(--sp-24)' }}
                        onClick={() => navigate(`/stock/${s.symbol}`)}
                    >
                        <div className="mk-header">
                            <div>
                                <div className="mk-symbol">{s.symbol}</div>
                                <div className="mk-name">{s.name || s.companyName || 'Stock Asset'}</div>
                                <SentimentBadge symbol={s.symbol} />
                            </div>
                            <div className={`mk-badge ${s.trend}`}>
                                {s.change >= 0 ? '+' : ''}{s.change?.toFixed(2)}%
                            </div>
                        </div>
                        <div className="mk-price">${(s.currentPrice || s.price)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="sparkline-box">
                            <Sparkline symbol={s.symbol} trend={s.trend} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Markets;
