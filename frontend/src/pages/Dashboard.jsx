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
import PortfolioValueChart from '../components/PortfolioValueChart';
import PerformanceComparison from '../components/PerformanceComparison';
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

                    {/* Portfolio Value Chart (only if portfolio has real holdings) */}
                    {portfolioSummary && <PortfolioValueChart />}

                    {/* Performance Comparison (only if portfolio has real holdings) */}
                    {portfolioSummary && <PerformanceComparison />}

                    {/* Top Performers row (only if watchlist has prices) */}
                    {watchlist.length > 1 && watchlist.some(s => s.currentPrice > 0) && (
                        <TopPerformers watchlist={watchlist} />
                    )}

                    {/* ── Selected Stock Detail ─────────────────────────── */}
                    {selectedStock ? (
                        <>
                            {/* Stock headline — Google Finance style */}
                            <div className="gf-stock-header">
                                <h1 className="gf-stock-name">{selectedStock.name || selectedStock.symbol}</h1>
                                <div className="gf-stock-exchange">
                                    {selectedStock.exchange || 'NASDAQ'}: {selectedStock.symbol}
                                </div>

                                <div className="gf-price-row">
                                    <span className="gf-price">{fmt(selectedStock.currentPrice)}</span>
                                    <span className="gf-price-currency">USD</span>
                                </div>

                                {fmt(selectedStock.change) !== null && (
                                    <div className="gf-change-row" style={{ color: changeColor }}>
                                        {selectedStock.change >= 0 ? '+' : ''}{fmt(selectedStock.change)} ({fmt(selectedStock.changePercent)}%)
                                        {selectedStock.change >= 0 ? ' ↑' : ' ↓'}
                                        {' '}today
                                    </div>
                                )}

                                <div className="gf-market-status">
                                    Closed: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })},{' '}
                                    {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </div>
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
                                <div className="stock-metrics-grid">
                                    {[
                                        { label: 'Open', val: fmt(selectedStock.open) ? `$${fmt(selectedStock.open)}` : '—' },
                                        { label: 'Mkt cap', val: selectedStock.marketCap ? (selectedStock.marketCap >= 1e12 ? `${(selectedStock.marketCap / 1e12).toFixed(2)}T` : `${(selectedStock.marketCap / 1e9).toFixed(2)}B`) : '—' },
                                        { label: 'Volume', val: selectedStock.volume ? `${(selectedStock.volume / 1e6).toFixed(2)}M` : '—' },
                                        { label: 'High', val: fmt(selectedStock.dayHigh) ? `$${fmt(selectedStock.dayHigh)}` : '—' },
                                        { label: 'P/E ratio', val: fmt(selectedStock.trailingPE) || '—' },
                                        { label: '52-wk high', val: fmt(selectedStock.fiftyTwoWeekHigh) ? `$${fmt(selectedStock.fiftyTwoWeekHigh)}` : '—' },
                                        { label: 'Low', val: fmt(selectedStock.dayLow) ? `$${fmt(selectedStock.dayLow)}` : '—' },
                                        { label: 'Prev close', val: fmt(selectedStock.previousClose) ? `$${fmt(selectedStock.previousClose)}` : '—' },
                                        { label: '52-wk low', val: fmt(selectedStock.fiftyTwoWeekLow) ? `$${fmt(selectedStock.fiftyTwoWeekLow)}` : '—' },
                                    ].map(({ label, val }) => (
                                        <div key={label} className="stock-metric-item">
                                            <span className="stock-metric-label">{label}</span>
                                            <span className="stock-metric-value">{val}</span>
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
