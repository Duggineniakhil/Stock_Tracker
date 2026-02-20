import React, { useState, useEffect } from 'react';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist, fetchStockHistory, fetchAlerts, fetchPortfolioSummary } from '../services/api';
import AddStockForm from '../components/AddStockForm';
import StockListItem from '../components/StockListItem';
import AlertList from '../components/AlertList';
import PriceChart from '../components/PriceChart';
import Navbar from '../components/Navbar';
import DashboardSummary from '../components/DashboardSummary';
import TopPerformers from '../components/TopPerformers';
import RecentActivity from '../components/RecentActivity';
import QuickActions from '../components/QuickActions';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Dashboard = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [portfolioSummary, setPortfolioSummary] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [chartRange, setChartRange] = useState('1mo');
    const [loading, setLoading] = useState(true);
    const [alertsLoading, setAlertsLoading] = useState(true);
    const { logout } = useAuth();

    // Fetch watchlist
    const loadWatchlist = async () => {
        try {
            const data = await fetchWatchlist();
            setWatchlist(data);
            // Auto-select first valid stock (has a real price)
            if (data.length > 0) {
                setSelectedStock(prev => {
                    if (prev) {
                        // keep current selection but update price data
                        const updated = data.find(s => s.symbol === prev.symbol);
                        return updated || data[0];
                    }
                    return data[0];
                });
            }
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch chart data whenever selected stock or range changes
    useEffect(() => {
        if (!selectedStock) return;
        setChartData([]); // clear so chart shows loading state
        const loadChartData = async () => {
            try {
                const history = await fetchStockHistory(selectedStock.symbol, chartRange);
                setChartData(history || []);
            } catch (error) {
                console.error('Chart fetch error:', error);
                setChartData([]);
            }
        };
        loadChartData();
    }, [selectedStock?.symbol, chartRange]);

    // Fetch alerts
    const loadAlerts = async () => {
        try {
            const data = await fetchAlerts(50, 0);
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setAlertsLoading(false);
        }
    };

    // Fetch portfolio summary (for widget — only show if data is valid)
    const loadPortfolioSummary = async () => {
        try {
            const summary = await fetchPortfolioSummary();
            // Only set if we got meaningful data
            if (summary && typeof summary.totalHoldings === 'number' && summary.totalHoldings > 0) {
                setPortfolioSummary(summary);
            }
        } catch (err) {
            // Portfolio may be empty - leave as null
        }
    };

    // Handlers
    const handleAddStock = async (symbol) => {
        await addToWatchlist(symbol);
        await loadWatchlist();
    };

    const handleRemoveStock = async (id) => {
        const isSelected = selectedStock && selectedStock.id === id;
        await removeFromWatchlist(id);
        const updatedList = await fetchWatchlist();
        setWatchlist(updatedList);
        if (isSelected) {
            setSelectedStock(updatedList.length > 0 ? updatedList[0] : null);
        }
    };

    // Initial fetch
    useEffect(() => {
        loadWatchlist();
        loadAlerts();
        loadPortfolioSummary();
    }, []);

    // Auto-refresh every 60s (relaxed to avoid rate limiting)
    useEffect(() => {
        const interval = setInterval(() => {
            loadWatchlist();
            loadAlerts();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Helpers
    const fmt = (n, d = 2) => (typeof n === 'number' && !isNaN(n) ? n.toFixed(d) : null);
    const changeColor = selectedStock && fmt(selectedStock.change) !== null
        ? (selectedStock.change >= 0 ? 'var(--market-green)' : 'var(--market-red)')
        : 'var(--text-secondary)';

    return (
        <>
            <Navbar />
            <div className="app-container">

                {/* ── MAIN CONTENT ─────────────────────────────────────── */}
                <main className="main-content">

                    {/* Summary Cards (only if portfolio has real holdings) */}
                    {portfolioSummary && <DashboardSummary summary={portfolioSummary} watchlist={watchlist} />}

                    {/* Top Performers row (only if watchlist has prices) */}
                    {watchlist.length > 1 && watchlist.some(s => s.currentPrice > 0) && (
                        <TopPerformers watchlist={watchlist} />
                    )}

                    {/* ── Selected Stock Detail ─────────────────────────── */}
                    {selectedStock ? (
                        <>
                            {/* Stock headline */}
                            <div className="main-header">
                                <div className="stock-headline">
                                    <h1>{selectedStock.name || selectedStock.symbol}</h1>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                                        {selectedStock.symbol} • Nasdaq • <span style={{ fontSize: '0.9rem' }}>Currency in USD</span>
                                    </div>
                                </div>
                                {fmt(selectedStock.currentPrice) && (
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="stock-price-large">
                                            {fmt(selectedStock.currentPrice)}
                                            <span className="stock-change-large" style={{ color: changeColor }}>
                                                {selectedStock.change >= 0 ? '+' : ''}{fmt(selectedStock.change)} ({fmt(selectedStock.changePercent)}%)
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--text-tertiary)', marginTop: '4px', fontSize: '0.85rem' }}>
                                            As of {new Date().toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chart */}
                            <div className="chart-container-large">
                                <PriceChart
                                    data={chartData}
                                    symbol={selectedStock.symbol}
                                    range={chartRange}
                                    onRangeChange={setChartRange}
                                />
                            </div>

                            {/* Stock detail metrics */}
                            {selectedStock.currentPrice > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                    gap: '24px', width: '100%', maxWidth: '1000px',
                                    marginBottom: '32px',
                                    padding: '24px 0',
                                    borderTop: '1px solid var(--border-color)',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    {[
                                        { label: 'Previous Close', val: fmt(selectedStock.previousClose) ? `$${fmt(selectedStock.previousClose)}` : '—' },
                                        { label: 'Day Range', val: fmt(selectedStock.dayLow) && fmt(selectedStock.dayHigh) ? `$${fmt(selectedStock.dayLow)} – $${fmt(selectedStock.dayHigh)}` : '—' },
                                        { label: 'Volume', val: selectedStock.volume ? `${(selectedStock.volume / 1e6).toFixed(2)}M` : '—' },
                                        { label: 'Market Cap', val: selectedStock.marketCap ? `$${(selectedStock.marketCap / 1e9).toFixed(2)}B` : '—' },
                                    ].map(({ label, val }) => (
                                        <div key={label}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>{label}</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 500 }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Recent alerts for this stock */}
                            {alerts.filter(a => a.symbol === selectedStock.symbol).length > 0 && (
                                <div style={{ width: '100%', maxWidth: '1000px', marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                                        Recent Alerts — {selectedStock.symbol}
                                    </h3>
                                    <AlertList alerts={alerts.filter(a => a.symbol === selectedStock.symbol)} loading={alertsLoading} />
                                </div>
                            )}
                        </>
                    ) : (
                        !loading && (
                            <div className="empty-state">
                                <div className="empty-icon">📈</div>
                                <h2>No stock selected</h2>
                                <p>Add stocks to your watchlist to get started.</p>
                            </div>
                        )
                    )}

                    {/* Bottom panels: Recent Activity + Quick Actions */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '16px',
                        width: '100%',
                        maxWidth: '1000px',
                        marginTop: '24px',
                        marginBottom: '48px'
                    }}>
                        <RecentActivity alerts={alerts} loading={alertsLoading} />
                        <QuickActions onAddStock={() => { }} />
                    </div>
                </main>

                {/* ── SIDEBAR ──────────────────────────────────────────── */}
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <div className="watchlist-subtitle">
                            <span style={{ fontSize: '1rem', fontWeight: 600 }}>📋 MY WATCHLIST</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Items: {watchlist.length}
                        </div>
                    </div>

                    <div className="add-stock-section">
                        <AddStockForm onAdd={handleAddStock} />
                    </div>

                    <div className="stock-list">
                        {watchlist.map((stock) => (
                            <StockListItem
                                key={stock.id}
                                stock={stock}
                                isSelected={selectedStock && selectedStock.id === stock.id}
                                onClick={setSelectedStock}
                                onRemove={handleRemoveStock}
                            />
                        ))}
                        {watchlist.length === 0 && !loading && (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                                Your watchlist is empty.
                                <br /><br />
                                Search above to add stocks.
                            </div>
                        )}
                        {loading && (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                                Loading...
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </>
    );
};

export default Dashboard;
