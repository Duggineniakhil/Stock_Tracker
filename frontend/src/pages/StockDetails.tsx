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
    const [stock, setStock] = useState<any | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [range, setRange] = useState('1mo');
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstance = useRef<any | null>(null);
    const [indicators, setIndicators] = useState({ sma: false, rsi: false });

    // Technical Analysis Helpers
    const calculateSMA = (data: number[], period: number) => {
        let result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
                continue;
            }
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    };

    const calculateRSI = (data: number[], period = 14) => {
        let result = [];
        let gains = [];
        let losses = [];
        for (let i = 1; i < data.length; i++) {
            const diff = data[i] - data[i - 1];
            gains.push(diff > 0 ? diff : 0);
            losses.push(diff < 0 ? Math.abs(diff) : 0);
        }
        
        for (let i = 0; i < data.length; i++) {
            if (i < period) {
                result.push(null);
                continue;
            }
            const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
            if (avgLoss === 0) result.push(100);
            else {
                const rs = avgGain / avgLoss;
                result.push(100 - (100 / (1 + rs)));
            }
        }
        return result;
    };

    const loadStockData = async () => {
        try {
            const res = await fetchStockData(symbol);
            setStock(res.data);
        } catch (err) {
            console.error('Error fetching stock details:', err);
        }
    };

    const loadHistory = async (newRange: string) => {
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
                        borderWidth: 2,
                        yAxisID: 'y'
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
                            displayColors: true,
                            callbacks: {
                                label: (context) => {
                                    const val = context.parsed.y.toFixed(2);
                                    return `${context.dataset.label}: ${context.dataset.label === 'RSI' ? val : '$' + val}`;
                                }
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
                            position: 'left',
                            grid: { color: 'rgba(255,255,255,0.03)' },
                            ticks: { color: '#555', callback: (val) => `$${val}` }
                        },
                        yRSI: {
                            display: indicators.rsi,
                            position: 'right',
                            min: 0,
                            max: 100,
                            grid: { display: false },
                            ticks: { color: '#555' },
                            title: { display: true, text: 'RSI', color: '#555' }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    }
                }
            });

            if (indicators.sma) {
                const smaData = calculateSMA(history.map(h => h.price), 20);
                chartInstance.current.data.datasets.push({
                    label: 'SMA (20)',
                    data: smaData,
                    borderColor: 'rgba(56, 130, 220, 0.8)',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y'
                });
            }

            if (indicators.rsi) {
                const rsiData = calculateRSI(history.map(h => h.price));
                chartInstance.current.data.datasets.push({
                    label: 'RSI',
                    data: rsiData,
                    borderColor: '#f0a500',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'yRSI'
                });
            }

            chartInstance.current.update();
        }
    }, [history, chartLoading, stock, indicators]);

    const handleRangeChange = (r: string) => {
        setRange(r);
        loadHistory(r);
    };

    if (loading) return <div className="page-loader">Fetching {symbol} Data...</div>;
    
    if (error) return (
        <div className="error-page" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h2 className="syne" style={{ marginBottom: '1rem' }}>Data Unavailable</h2>
            <p className="muted" style={{ marginBottom: '2rem' }}>{error}</p>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                Try Again
            </button>
        </div>
    );

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
                <div className="sd-chart-controls">
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
                    <div className="sd-indicators">
                        <label className="indicator-toggle">
                            <input type="checkbox" checked={indicators.sma} onChange={e => setIndicators({...indicators, sma: e.target.checked})} />
                            <span>SMA 20</span>
                        </label>
                        <label className="indicator-toggle">
                            <input type="checkbox" checked={indicators.rsi} onChange={e => setIndicators({...indicators, rsi: e.target.checked})} />
                            <span>RSI</span>
                        </label>
                    </div>
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
