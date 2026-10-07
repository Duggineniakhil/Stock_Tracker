import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchStockData, fetchStockHistory, addToWatchlist, fetchWatchlist } from '../services/api';
import SentimentBadge from '../components/ai/SentimentBadge';
import { Chart, registerables } from 'chart.js';
import './StockDetails.css';

Chart.register(...registerables);

const RANGES = [
    { value: '1d', label: '1D' },
    { value: '5d', label: '5D' },
    { value: '1mo', label: '1M' },
    { value: '6mo', label: '6M' },
    { value: 'ytd', label: 'YTD' },
    { value: '1y', label: '1Y' },
    { value: 'max', label: '5Y' },
];

// Compact number formatting: 1.2K, 3.4M, 5.6B, 7.8T
const formatCompact = (value?: number, prefix = '') => {
    if (typeof value !== 'number' || !isFinite(value) || value <= 0) return '—';
    return prefix + new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
};

const formatPrice = (value?: number) =>
    typeof value === 'number' && isFinite(value) && value > 0 ? `$${value.toFixed(2)}` : '—';

const StockDetails = () => {
    const { symbol } = useParams();
    const [stock, setStock] = useState<any | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [range, setRange] = useState('1mo');
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstance = useRef<any | null>(null);
    const [indicators, setIndicators] = useState({ sma: false, rsi: false });
    const [following, setFollowing] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [followError, setFollowError] = useState<string | null>(null);

    // Technical Analysis Helpers
    const calculateSMA = (data: number[], period: number) => {
        const result = [];
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
        const result = [];
        const gains = [];
        const losses = [];
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
            const res = await fetchStockData(symbol!);
            setStock(res.data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching stock details:', err);
            setStock(null);
            setError(err?.response?.status === 404
                ? `We couldn't find a stock with the symbol "${symbol}".`
                : 'Stock data is temporarily unavailable. Please try again in a moment.');
        }
    };

    const loadFollowState = async () => {
        try {
            const res = await fetchWatchlist();
            setFollowing((res.data || []).some((w: any) => w.symbol === symbol?.toUpperCase()));
        } catch {
            // Non-critical: the button simply starts in the "Add" state
        }
    };

    const handleFollow = async () => {
        if (!stock) return;
        setFollowBusy(true);
        setFollowError(null);
        try {
            await addToWatchlist(stock.symbol);
            setFollowing(true);
        } catch (err: any) {
            if (err?.response?.status === 409) setFollowing(true);
            else setFollowError("Couldn't add to your watchlist. Please try again.");
        } finally {
            setFollowBusy(false);
        }
    };

    const loadHistory = async (newRange: string) => {
        setChartLoading(true);
        try {
            const res = await fetchStockHistory(symbol!, newRange);
            setHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setChartLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        setFollowing(false);
        setFollowError(null);
        Promise.all([loadStockData(), loadHistory(range), loadFollowState()]).finally(() => setLoading(false));
    }, [symbol]);

    useEffect(() => () => {
        chartInstance.current?.destroy();
        chartInstance.current = null;
    }, []);

    useEffect(() => {
        if (!chartLoading && history.length > 0 && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            const color = stock?.change >= 0 ? '0, 232, 135' : '240, 80, 80';
            gradient.addColorStop(0, `rgba(${color}, 0.2)`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: history.map(h => {
                        const d = new Date(h.date);
                        if (range === '1d') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        if (range === 'max') return d.toLocaleDateString([], { month: 'short', year: 'numeric' });
                        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }),
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
                                    const val = context.parsed.y;
                                    if (val === null) return '';
                                    return `${context.dataset.label}: ${context.dataset.label === 'RSI' ? val.toFixed(2) : '$' + val.toFixed(2)}`;
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
    }, [history, chartLoading, stock, indicators, range]);

    const handleRangeChange = (r: string) => {
        setRange(r);
        loadHistory(r);
    };

    if (loading) return <div className="page-loader">Fetching {symbol} Data...</div>;
    
    if (error || !stock) return (
        <div className="error-page" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h2 className="syne" style={{ marginBottom: '1rem' }}>Data Unavailable</h2>
            <p className="muted" style={{ marginBottom: '2rem' }}>{error || 'This stock could not be loaded.'}</p>
            <div style={{ display: 'flex', gap: 'var(--sp-12)', justifyContent: 'center' }}>
                <Link to="/markets" className="btn btn-secondary">Back to Markets</Link>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </div>
        </div>
    );

    const isPositive = stock.change >= 0;

    return (
        <div className="stock-details-page reveal">
            <Link to="/markets" className="back-link">← Back to Markets</Link>
            <header className="sd-header">
                <div className="sd-brand">
                    <div className="sd-logo">{stock.symbol.substring(0, 2)}</div>
                    <div>
                        <h1 className="syne">{stock.name}</h1>
                        <div className="sd-meta">
                            {stock.exchange ? `${stock.exchange}: ` : ''}{stock.symbol} • <SentimentBadge symbol={stock.symbol} />
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <button
                        className={`btn ${following ? 'btn-outline' : 'btn-secondary'}`}
                        onClick={handleFollow}
                        disabled={following || followBusy}
                        aria-pressed={following}
                    >
                        {following ? '✓ In watchlist' : followBusy ? 'Adding...' : '+ Add to watchlist'}
                    </button>
                    {followError && <div className="small-text dn" role="alert" style={{ marginTop: 'var(--sp-8)' }}>{followError}</div>}
                </div>
            </header>

            <div className="sd-price-section">
                <div className="sd-price-row">
                    <span className="sd-current-price">${stock.currentPrice?.toFixed(2)}</span>
                    <span className="sd-currency">USD</span>
                </div>
                <div className={`sd-change ${isPositive ? 'up' : 'dn'}`}>
                    {isPositive ? '+' : ''}{stock.change?.toFixed(2)} ({stock.changePercent?.toFixed(2)}%) 
                    <span className="sd-trend-icon">{isPositive ? '▲' : '▼'}</span>
                    <span className="muted small-text" style={{ marginLeft: '8px' }}>today</span>
                </div>
            </div>

            <div className="sd-chart-container">
                <div className="sd-chart-controls">
                    <div className="sd-range-selector">
                        {RANGES.map(r => (
                            <button
                                key={r.value}
                                className={`range-btn ${range === r.value ? 'active' : ''}`}
                                onClick={() => handleRangeChange(r.value)}
                                aria-pressed={range === r.value}
                            >
                                {r.label}
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
                    {!chartLoading && history.length === 0 && <div className="chart-overlay">No price history available for this range.</div>}
                </div>
            </div>

            <div className="sd-stats-grid">
                <div className="sd-stat-item">
                    <span className="stat-label">Open</span>
                    <span className="stat-val">{formatPrice(stock.open)}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">Mkt cap</span>
                    <span className="stat-val">{formatCompact(stock.marketCap, '$')}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">High</span>
                    <span className="stat-val">{formatPrice(stock.dayHigh)}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">P/E ratio</span>
                    <span className="stat-val">{stock.trailingPE?.toFixed(2) || '—'}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">Low</span>
                    <span className="stat-val">{formatPrice(stock.dayLow)}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">52-wk high</span>
                    <span className="stat-val">{formatPrice(stock.fiftyTwoWeekHigh)}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">Volume</span>
                    <span className="stat-val">{formatCompact(stock.volume)}</span>
                </div>
                <div className="sd-stat-item">
                    <span className="stat-label">52-wk low</span>
                    <span className="stat-val">{formatPrice(stock.fiftyTwoWeekLow)}</span>
                </div>
            </div>
        </div>
    );
};

export default StockDetails;
