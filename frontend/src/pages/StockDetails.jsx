import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStockData, fetchStockHistory, addToWatchlist, fetchStockSentiment } from '../services/api';
import SentimentBadge from '../components/ai/SentimentBadge';
import { Chart, registerables } from 'chart.js';
import './StockDetails.css';

Chart.register(...registerables);

const StockDetails = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [stock, setStock] = useState(null);
    const [history, setHistory] = useState([]);
    const [range, setRange] = useState('1mo');
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const loadStockData = async () => {
        try {
            const res = await fetchStockData(symbol);
            setStock(res.data);
        } catch (err) {
            console.error('Error fetching stock details:', err);
        }
    };

    const loadHistory = async (newRange) => {
        setChartLoading(true);
        try {
            const res = await fetchStockHistory(symbol, newRange);
            setHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setChartLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([loadStockData(), loadHistory(range)]).finally(() => setLoading(false));
    }, [symbol]);

    useEffect(() => {
        if (!chartLoading && history.length > 0 && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            const color = stock?.change >= 0 ? '0, 232, 135' : '240, 80, 80';
            gradient.addColorStop(0, `rgba(${color}, 0.2)`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: history.map(h => new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' })),
                    datasets: [{
                        label: 'Price',
                        data: history.map(h => h.price),
                        borderColor: `rgb(${color})`,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#1a1a1a',
                            titleColor: '#888',
                            bodyColor: '#fff',
                            borderColor: '#333',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => `$${context.parsed.y.toFixed(2)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: { display: false },
                            ticks: { color: '#555', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
                        },
                        y: {
                            display: true,
                            grid: { color: 'rgba(255,255,255,0.03)' },
                            ticks: { color: '#555', callback: (val) => `$${val}` }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    }
                }
            });
        }
    }, [history, chartLoading, stock]);

    const handleRangeChange = (r) => {
        setRange(r);
        loadHistory(r);
    };

    if (loading) return <div className="page-loader">Fetching {symbol} Data...</div>;
    if (!stock) return <div className="error-page">Stock not found</div>;

    const isPositive = stock.change >= 0;

    return (
        <div className="stock-details-page reveal">
            <header className="sd-header">
                <div className="sd-brand">
                    <div className="sd-logo">{stock.symbol.substring(0, 2)}</div>
                    <div>
                        <h1 className="syne">{stock.name}</h1>
                        <div className="sd-meta">
                            {stock.exchange}: {stock.symbol} • <SentimentBadge symbol={stock.symbol} />
                        </div>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={() => addToWatchlist(stock.symbol)}>
                    + Follow
                </button>
            </header>

            <div className="sd-price-section">
                <div className="sd-price-row">
                    <span className="sd-current-price">${stock.currentPrice?.toFixed(2)}</span>
                    <span className="sd-currency">USD</span>
                </div>
                <div className={`sd-change ${isPositive ? 'up' : 'dn'}`}>
                    {isPositive ? '+' : ''}{stock.change?.toFixed(2)} ({stock.changePercent?.toFixed(2)}%) 
                    <span className="sd-trend-icon">{isPositive ? '▲' : '▼'}</span>
                    <span className="muted small-text" style={{ marginLeft: '8px' }}>past {range === '1d' ? 'day' : range}</span>
                </div>
            </div>

            <div className="sd-chart-container">
                <div className="sd-range-selector">
                    {['1d', '5d', '1mo', '6mo', 'YTD', '1y', 'max'].map(r => (
                        <button 
                            key={r} 
                            className={`range-btn ${range === r ? 'active' : ''}`}
                            onClick={() => handleRangeChange(r)}
                        >
                            {r.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="sd-chart-box">
                    <canvas ref={chartRef}></canvas>
                    {chartLoading && <div className="chart-overlay">Loading Chart...</div>}
                </div>
            </div>

            <div className="sd-stats-grid">
                <div className="sd-stat-item">
                    <span className="stat-label">Open</span>
                    <span className="stat-val">${stock.open?.toFixed(2) || '—'}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">Mkt cap</span>
                    <span className="stat-val">{(stock.marketCap / 1e12).toFixed(2)}T</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">High</span>
                    <span className="stat-val">${stock.dayHigh?.toFixed(2) || '—'}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">P/E ratio</span>
                    <span className="stat-val">{stock.trailingPE?.toFixed(2) || '—'}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">Low</span>
                    <span className="stat-val">${stock.dayLow?.toFixed(2) || '—'}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">52-wk high</span>
                    <span className="stat-val">${stock.fiftyTwoWeekHigh?.toFixed(2) || '—'}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">Volume</span>
                    <span className="stat-val">{(stock.volume / 1e6).toFixed(2)}M</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">52-wk low</span>
                    <span className="stat-val">${stock.fiftyTwoWeekLow?.toFixed(2) || '—'}</span>
                </div>
            </div>
        </div>
    );
};

export default StockDetails;
