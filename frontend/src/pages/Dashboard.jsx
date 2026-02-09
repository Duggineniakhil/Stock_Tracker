import React, { useState, useEffect } from 'react';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist, fetchStockHistory, fetchAlerts } from '../services/api';
import AddStockForm from '../components/AddStockForm';
import StockListItem from '../components/StockListItem';
import AlertList from '../components/AlertList';
import PriceChart from '../components/PriceChart';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Dashboard = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [chartRange, setChartRange] = useState('1mo');
    const [loading, setLoading] = useState(true);
    const [alertsLoading, setAlertsLoading] = useState(true);
    const { logout, user } = useAuth();

    // Fetch watchlist
    const fetchWatchlist = async () => {
        try {
            const data = await fetchWatchlist();
            setWatchlist(data);
            if (data.length > 0 && !selectedStock) {
                setSelectedStock(data[0]);
            } else if (selectedStock) {
                // Refresh selected
                const updated = data.find(s => s.symbol === selectedStock.symbol);
                if (updated) setSelectedStock(updated);
            }
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch chart data
    useEffect(() => {
        if (!selectedStock) return;

        const loadChartData = async () => {
            try {
                const history = await fetchStockHistory(selectedStock.symbol, chartRange);
                setChartData(history);
            } catch (error) {
                console.error('Error fetching chart data:', error);
                setChartData([]);
            }
        };

        loadChartData();
    }, [selectedStock, chartRange]);

    // Fetch alerts
    const fetchAlerts = async () => {
        try {
            const data = await fetchAlerts(50, 0);
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setAlertsLoading(false);
        }
    };

    // Handlers
    const handleAddStock = async (symbol) => {
        await addToWatchlist(symbol);
        await fetchWatchlist();
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
        fetchWatchlist();
        fetchAlerts();
    }, []);

    // Auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            fetchWatchlist();
            fetchAlerts();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="app-container">
            {/* MAIN CONTENT */}
            <main className="main-content">
                {selectedStock ? (
                    <>
                        <div className="main-header">
                            <div className="stock-headline">
                                <h1>{selectedStock.name || selectedStock.symbol}</h1>
                                <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                    {selectedStock.symbol} • Nasdaq • <span style={{ fontSize: '0.9rem' }}>Currency in USD</span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div className="stock-price-large">
                                    {selectedStock.currentPrice?.toFixed(2)}
                                    <span className="stock-change-large" style={{
                                        color: selectedStock.change >= 0 ? 'var(--market-green)' : 'var(--market-red)'
                                    }}>
                                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change?.toFixed(2)} ({selectedStock.changePercent?.toFixed(2)}%)
                                    </span>
                                </div>
                                <div style={{ color: 'var(--text-tertiary)', marginTop: '4px', fontSize: '0.9rem' }}>
                                    {new Date().toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="chart-container-large">
                            <PriceChart
                                data={chartData}
                                symbol={selectedStock.symbol}
                                range={chartRange}
                                onRangeChange={setChartRange}
                            />
                        </div>

                        {/* Details Grid */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '24px', width: '100%', maxWidth: '1000px', marginBottom: '40px',
                            padding: '24px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)'
                        }}>
                            <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Previous Close</div><div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{selectedStock.previousClose?.toFixed(2)}</div></div>
                            <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Day Range</div><div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{selectedStock.dayLow?.toFixed(2)} - {selectedStock.dayHigh?.toFixed(2)}</div></div>
                            <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Volume</div><div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{(selectedStock.volume / 1000000).toFixed(2)}M</div></div>
                            <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Market Cap</div><div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{selectedStock.marketCap ? (selectedStock.marketCap / 1000000000).toFixed(2) + 'B' : '-'}</div></div>
                        </div>

                        <div style={{ width: '100%', maxWidth: '1000px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 400, marginBottom: '16px', color: 'var(--text-secondary)' }}>Recent Alerts</h3>
                            <AlertList alerts={alerts.filter(a => a.symbol === selectedStock.symbol)} loading={alertsLoading} />
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📈</div>
                        <h2>Select a stock to view details</h2>
                        {watchlist.length === 0 && <p>Add stocks to your watchlist to get started.</p>}
                    </div>
                )}
            </main>

            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="app-logo">
                        <span style={{ fontSize: '1.4rem' }}>📊</span> Stock Dashboard
                    </div>
                    <div className="watchlist-subtitle">
                        <span>{user?.email}'s Watchlist</span>
                        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.8rem' }}>Logout</button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span>Items: {watchlist.length}</span>
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
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            Your watchlist is empty.
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default Dashboard;
