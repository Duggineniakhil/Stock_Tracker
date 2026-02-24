import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchPortfolioHistory } from '../services/api';
import './PortfolioValueChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RANGES = [
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: 'YTD', value: 'ytd' },
    { label: '1Y', value: '1y' },
];

const PortfolioValueChart = () => {
    const [range, setRange] = useState('1mo');
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchPortfolioHistory(range)
            .then(res => {
                if (!cancelled) {
                    const data = res?.data || res || [];
                    setHistoryData(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => { if (!cancelled) setHistoryData([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [range]);

    if (loading) {
        return (
            <div className="portfolio-value-chart">
                <div className="pvc-header">
                    <h3 className="pvc-title">📈 Portfolio Value</h3>
                </div>
                <div className="pvc-loading">Loading chart data...</div>
            </div>
        );
    }

    if (!historyData || historyData.length === 0) {
        return (
            <div className="portfolio-value-chart">
                <div className="pvc-header">
                    <h3 className="pvc-title">📈 Portfolio Value</h3>
                </div>
                <div className="pvc-empty">Add holdings to see your portfolio value chart.</div>
            </div>
        );
    }

    const labels = historyData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const values = historyData.map(d => d.value);
    const startVal = values[0];
    const endVal = values[values.length - 1];
    const changeVal = endVal - startVal;
    const changePct = startVal > 0 ? ((changeVal / startVal) * 100).toFixed(2) : 0;
    const isPositive = changeVal >= 0;

    const chartData = {
        labels,
        datasets: [{
            label: 'Portfolio Value',
            data: values,
            borderColor: isPositive ? '#22c55e' : '#ef4444',
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
                if (isPositive) {
                    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
                    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.01)');
                } else {
                    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
                    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
                }
                return gradient;
            },
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHitRadius: 10,
            borderWidth: 2.5,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 15, 25, 0.9)',
                titleColor: '#a0a0b0',
                bodyColor: '#ffffff',
                borderColor: 'rgba(100,100,140,0.3)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (ctx) => `$${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#6b7280', maxTicksLimit: 8, font: { size: 11 } },
                border: { display: false }
            },
            y: {
                grid: { color: 'rgba(100,100,140,0.1)' },
                ticks: {
                    color: '#6b7280',
                    font: { size: 11 },
                    callback: (v) => `$${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`
                },
                border: { display: false }
            }
        }
    };

    return (
        <div className="portfolio-value-chart">
            <div className="pvc-header">
                <div>
                    <h3 className="pvc-title">📈 Portfolio Value</h3>
                    <div className="pvc-value-row">
                        <span className="pvc-current">${endVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className={`pvc-change ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '+' : ''}{changeVal.toFixed(2)} ({changePct}%)
                        </span>
                    </div>
                </div>
                <div className="pvc-range-btns">
                    {RANGES.map(r => (
                        <button
                            key={r.value}
                            className={`pvc-range-btn ${range === r.value ? 'active' : ''}`}
                            onClick={() => setRange(r.value)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="pvc-chart-wrapper">
                <Line ref={chartRef} data={chartData} options={options} />
            </div>
        </div>
    );
};

export default PortfolioValueChart;
