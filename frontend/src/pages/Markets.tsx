import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWatchlist, fetchStockData, addToWatchlist, removeFromWatchlist, fetchTrending } from '../services/api';
import SentimentBadge from '../components/ai/SentimentBadge';
import Sparkline from '../components/Sparkline';
import './Markets.css';

const SEARCH_DEBOUNCE_MS = 400;

const formatPercent = (value?: number) =>
    typeof value === 'number' ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : '—';

const Markets = () => {
    const navigate = useNavigate();
    const [watchlist, setWatchlist] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<any | null>(null);
    const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'done'>('idle');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [trending, setTrending] = useState<any[]>([]);
    const latestQuery = useRef('');

    const loadData = async () => {
        try {
            const [wRes, tRes] = await Promise.all([
                fetchWatchlist(),
                fetchTrending()
            ]);
            setWatchlist(wRes.data || []);
            setTrending(tRes.data || []);
            setLoadError(null);
        } catch (err) {
            console.error('Error fetching market data:', err);
            setLoadError('We couldn\'t load market data right now. Please refresh the page to try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        setRecentSearches(saved);
    }, []);

    // Debounced symbol lookup; responses for outdated queries are ignored
    useEffect(() => {
        const query = searchQuery.trim();
        latestQuery.current = query;

        if (query.length < 1) {
            setSearchResult(null);
            setSearchStatus('idle');
            return;
        }

        setSearchStatus('searching');
        const timer = setTimeout(async () => {
            try {
                const res = await fetchStockData(query);
                if (latestQuery.current === query) setSearchResult(res.data);
            } catch {
                if (latestQuery.current === query) setSearchResult(null);
            } finally {
                if (latestQuery.current === query) setSearchStatus('done');
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const saveRecentSearch = (symbol: string) => {
        const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const openStock = (symbol: string) => {
        saveRecentSearch(symbol);
        navigate(`/stock/${symbol}`);
    };

    const watchedSymbols = new Set(watchlist.map(w => w.symbol));

    const handleAddToWatchlist = async (symbol: string) => {
        setNotice(null);
        try {
            await addToWatchlist(symbol);
            setSearchResult(null);
            setSearchQuery('');
            setNotice({ type: 'success', text: `${symbol} added to your watchlist.` });
            loadData();
        } catch (err: any) {
            const status = err?.response?.status;
            setNotice({
                type: 'error',
                text: status === 409 ? `${symbol} is already in your watchlist.` : `Couldn't add ${symbol} to your watchlist. Please try again.`,
            });
        }
    };

    const handleRemove = async (e: React.MouseEvent, item: any) => {
        e.stopPropagation();
        setNotice(null);
        try {
            await removeFromWatchlist(item.id);
            setWatchlist(prev => prev.filter(w => w.id !== item.id));
        } catch {
            setNotice({ type: 'error', text: `Couldn't remove ${item.symbol}. Please try again.` });
        }
    };

    if (loading) return <div className="page-loader">Scanning Markets...</div>;

    return (
        <div className="markets-page">
            <header className="reveal" style={{ paddingTop: 'var(--sp-48)', paddingBottom: 'var(--sp-32)' }}>
                <div className="hbadge"><span className="ldot"></span> Global Equities</div>
                <h1 className="h1" style={{ margin: 0 }}>Market<br /><span className="g-text">Explorer.</span></h1>
            </header>

            {loadError && <div className="alert-banner error" role="alert">{loadError}</div>}
            {notice && <div className={`alert-banner ${notice.type}`} role="status">{notice.text}</div>}

            <div className="search-bar">
                <label htmlFor="market-search" className="sr-only">Search by stock symbol</label>
                <input
                    id="market-search"
                    type="search"
                    placeholder="Search by symbol (e.g. AAPL, MSFT, RELIANCE.NS)"
                    value={searchQuery}
                    autoComplete="off"
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchResult) openStock(searchResult.symbol);
                        if (e.key === 'Escape') setSearchQuery('');
                    }}
                />
                {searchStatus !== 'idle' && (
                    <div className="search-result-card" role="status">
                        {searchStatus === 'searching' ? (
                            <div className="muted">Searching...</div>
                        ) : searchResult ? (
                            <>
                                <button className="search-result-info" onClick={() => openStock(searchResult.symbol)}>
                                    <div style={{ fontFamily: 'var(--font-site)', fontWeight: 800 }}>{searchResult.symbol}</div>
                                    <div className="small-text">{searchResult.name || searchResult.companyName}</div>
                                </button>
                                <div style={{ display: 'flex', gap: 'var(--sp-16)', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontFamily: 'var(--font-site)', fontWeight: 700 }}>
                                            ${(searchResult.currentPrice || searchResult.price)?.toFixed(2)}
                                        </div>
                                        <div className={`small-text ${searchResult.changePercent >= 0 ? 'up' : 'dn'}`}>
                                            {formatPercent(searchResult.changePercent)}
                                        </div>
                                    </div>
                                    {watchedSymbols.has(searchResult.symbol) ? (
                                        <span className="small-text accent-text">✓ In watchlist</span>
                                    ) : (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleAddToWatchlist(searchResult.symbol)}>
                                            + Watchlist
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="muted">
                                No stock found for "{searchQuery.trim()}". Check the ticker symbol — non-US stocks need an exchange suffix (e.g. RELIANCE.NS).
                            </div>
                        )}
                    </div>
                )}
            </div>

            {trending.length > 0 && !searchQuery && (
                <div className="trending-section reveal">
                    <div className="sec-label">Trending Today</div>
                    <div className="trending-list">
                        {trending.map(s => (
                            <button key={s.symbol} className="trending-pill" onClick={() => openStock(s.symbol)}>
                                <span className="p-sym">{s.symbol}</span>
                                <span className={`p-ch ${s.changePercent >= 0 ? 'up' : 'dn'}`}>
                                    {formatPercent(s.changePercent)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {recentSearches.length > 0 && !searchQuery && (
                <div className="recent-searches reveal">
                    <span className="small-text muted">Recently viewed:</span>
                    <div className="recent-tags">
                        {recentSearches.map(s => (
                            <button key={s} className="recent-tag" onClick={() => navigate(`/stock/${s}`)}>
                                {s}
                            </button>
                        ))}
                        <button className="clear-recent" onClick={() => { setRecentSearches([]); localStorage.removeItem('recentSearches'); }}>
                            Clear
                        </button>
                    </div>
                </div>
            )}

            <div className="sec-label">My Watchlist</div>
            {watchlist.length > 0 ? (
                <div className="mkt-grid">
                    {watchlist.map((s) => {
                        const trend = s.changePercent >= 0 ? 'up' : 'dn';
                        return (
                            <div
                                className="card clickable mk-card"
                                key={s.id || s.symbol}
                                role="link"
                                tabIndex={0}
                                aria-label={`View ${s.symbol} details`}
                                onClick={() => openStock(s.symbol)}
                                onKeyDown={(e) => { if (e.key === 'Enter') openStock(s.symbol); }}
                            >
                                <div className="mk-header">
                                    <div>
                                        <div className="mk-symbol">{s.symbol}</div>
                                        <div className="mk-name">{s.name || s.companyName || 'Stock'}</div>
                                        <SentimentBadge symbol={s.symbol} />
                                    </div>
                                    <div className="mk-header-right">
                                        <div className={`mk-badge ${trend}`}>{formatPercent(s.changePercent)}</div>
                                        <button
                                            className="mk-remove"
                                            aria-label={`Remove ${s.symbol} from watchlist`}
                                            title="Remove from watchlist"
                                            onClick={(e) => handleRemove(e, s)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                                <div className="mk-price">
                                    {typeof s.currentPrice === 'number'
                                        ? `$${s.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : <span className="small-text">Price unavailable</span>}
                                </div>
                                <div className="sparkline-box">
                                    <Sparkline symbol={s.symbol} trend={trend} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <strong>Your watchlist is empty</strong>
                    <span>Search for a ticker above{trending.length > 0 ? ' or open a trending stock' : ''} and add it to follow its price here.</span>
                </div>
            )}
        </div>
    );
};

export default Markets;
