import React, { useState, useEffect, useRef } from 'react';
import { fetchPortfolioSummary, fetchPortfolio, fetchPortfolioHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InsightCard from '../components/ai/InsightCard';
import { Chart, registerables } from 'chart.js';
import './Dashboard.css';

Chart.register(...registerables);

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Chart state
    const [history, setHistory] = useState([]);
    const [range, setRange] = useState('1mo');
    const [chartLoading, setChartLoading] = useState(false);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const loadHistory = async (newRange) => {
        setChartLoading(true);
        try {
            const res = await fetchPortfolioHistory(newRange);
            setHistory(res.data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setChartLoading(false);
        }
    };

    useEffect(() => {
        const getDashboardData = async () => {
            try {
                const [summaryRes, portfolioRes] = await Promise.all([
                    fetchPortfolioSummary(),
                    fetchPortfolio()
                ]);
                setSummary(summaryRes.data);
                const sortedHoldings = [...portfolioRes.data].sort((a, b) => 
                    (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity)
                ).slice(0, 6);
                setHoldings(sortedHoldings);
                loadHistory(range);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };

        getDashboardData();
    }, []);

    // Render Chart
    useEffect(() => {
        if (!chartLoading && history.length > 0 && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 120);
            
            // Determine if overall history trend is positive
            const isTrendPositive = history.length > 1 ? history[history.length - 1].value >= history[0].value : true;
            const color = isTrendPositive ? '0, 232, 135' : '240, 80, 80';
            
            gradient.addColorStop(0, `rgba(${color}, 0.2)`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: history.map(h => {
                        const d = new Date(h.date);
                        return range === '1d' ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }),
                    datasets: [{
                        label: 'Portfolio Value',
                        data: history.map(h => h.value),
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
                                label: (context) => `$${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            }
                        }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false, min: Math.min(...history.map(h => h.value)) * 0.99 }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    }
                }
            });
        }
    }, [history, chartLoading, range]);

    const handleRangeChange = (r) => {
        setRange(r);
        loadHistory(r);
    };

    if (loading) return <div className="page-loader">Loading Dashboard...</div>;

    const totalValue = summary?.totalValue || 0;
    const totalChange = summary?.totalChange || 0;
    const totalChangePercent = summary?.totalChangePercent || 0;
    const isPositive = totalChange >= 0;

    return (
        <div className="dashboard-container">
            <header className="hero reveal" style={{ padding: 'var(--sp-48) 0 var(--sp-32)' }}>
                <div className="hbadge"><span className="ldot"></span> Performance Overview</div>
                <h1 className="h1">
                    {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your Portfolio'},<br />
                    <span className="g-text">At a Glance.</span>
                </h1>
            </header>

        <div className="db-wrap reveal" style={{ maxWidth: '800px', marginBottom: 'var(--sp-64)' }}>
                <div className="db-bar">
                    <div className="dots">
                        <div className="dot" style={{ background: 'var(--market-red)' }}></div>
                        <div className="dot" style={{ background: 'var(--market-yellow)' }}></div>
                        <div className="dot" style={{ background: 'var(--market-green)' }}></div>
                    </div>
                    <span className="small-text muted">quotra — dashboard summary</span>
                    <div style={{ width: '46px' }}></div>
                </div>
                <div className="db-body">
                    <div className="db-top">
                        <div>
                            <div className="bal-lbl">Total portfolio value</div>
                            <div className="bal-val">
                                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className={`bal-ch ${isPositive ? 'up' : 'dn'}`}>
                                    {isPositive ? '+' : ''}{totalChangePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="tabs">
                            {['1d', '1w', '1mo', '1y'].map(r => (
                                <button 
                                    key={r} 
                                    className={`tab ${range === r ? 'a' : ''}`}
                                    onClick={() => handleRangeChange(r)}
                                    style={{ textTransform: 'uppercase' }}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="chart-box" style={{ height: '120px', position: 'relative' }}>
                        <canvas ref={chartRef}></canvas>
                        {chartLoading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)' }}>Updating...</div>}
                        {!chartLoading && history.length === 0 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)' }}>No history data</div>}
                    </div>

                    <div className="sec-label">Top Holdings</div>
                    <div className="scards">
                        {holdings.length > 0 ? holdings.map((h, i) => (
                            <div className="sc" key={i}>
                                <div className="sc-sym">{h.symbol}</div>
                                <div className="sc-nm">{h.quantity} shares</div>
                                <div className="sc-px">${h.currentPrice?.toFixed(2)}</div>
                                <div className={`sc-ch ${h.change >= 0 ? 'up' : 'dn'}`}>
                                    {h.change >= 0 ? '+' : ''}{h.changePercent?.toFixed(2)}%
                                </div>
                            </div>
                        )) : (
                            <div className="card muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--sp-32)' }}>
                                No holdings yet. Start by adding an asset in Portfolio.
                            </div>
                        )}
                    </div>
                </div>

                <div className="db-sidebar reveal">
                    <InsightCard />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
