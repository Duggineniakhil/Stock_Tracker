import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchPortfolioPerformance } from '../services/api';
import './PerformanceComparison.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const COLORS = [
    '#6366f1', // indigo
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
];

const RANGES = [
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '1Y', value: '1y' },
];

const PerformanceComparison = () => {
    const [range, setRange] = useState('1mo');
    const [perfData, setPerfData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchPortfolioPerformance(range)
            .then(res => {
                if (!cancelled) {
                    const data = res?.data || res || [];
                    setPerfData(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => { if (!cancelled) setPerfData([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [range]);

    if (loading) {
        return (
            <div className="performance-comparison">
                <div className="pc-header">
                    <h3 className="pc-title">📊 Performance Comparison</h3>
                </div>
                <div className="pc-loading">Loading performance data...</div>
            </div>
        );
    }

    if (!perfData || perfData.length === 0) {
        return (
            <div className="performance-comparison">
                <div className="pc-header">
                    <h3 className="pc-title">📊 Performance Comparison</h3>
                </div>
                <div className="pc-empty">Add at least 2 holdings to compare performance.</div>
            </div>
        );
    }

    // Use the longest dataset for labels
    const longestData = perfData.reduce((a, b) => (a.data.length >= b.data.length ? a : b));
    const labels = longestData.data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const datasets = perfData.map((holding, index) => ({
        label: holding.symbol,
        data: holding.data.map(d => d.returnPct),
        borderColor: COLORS[index % COLORS.length],
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 0,
        pointHitRadius: 10,
        borderWidth: 2,
    }));

    const chartData = { labels, datasets };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    color: '#a0a0b0',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 16,
                    font: { size: 12, weight: 500 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 15, 25, 0.9)',
                titleColor: '#a0a0b0',
                bodyColor: '#ffffff',
                borderColor: 'rgba(100,100,140,0.3)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}%`
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
                    callback: (v) => `${v > 0 ? '+' : ''}${v}%`
                },
                border: { display: false }
            }
        }
    };

    return (
        <div className="performance-comparison">
            <div className="pc-header">
                <h3 className="pc-title">📊 Performance Comparison</h3>
                <div className="pc-range-btns">
                    {RANGES.map(r => (
                        <button
                            key={r.value}
                            className={`pc-range-btn ${range === r.value ? 'active' : ''}`}
                            onClick={() => setRange(r.value)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="pc-chart-wrapper">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default PerformanceComparison;
