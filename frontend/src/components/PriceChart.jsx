import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
} from 'chart.js';
import './PriceChart.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler
);

const PriceChart = ({ data, symbol, range, onRangeChange }) => {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const gradientFill = ctx.createLinearGradient(0, 0, 0, 380);

        const isPositive = data[data.length - 1].price >= data[0].price;
        const lineColor = isPositive ? '#34A853' : '#EA4335';
        const fillColor = isPositive ? 'rgba(52, 168, 83, 0.15)' : 'rgba(234, 67, 53, 0.15)';

        gradientFill.addColorStop(0, fillColor);
        gradientFill.addColorStop(1, 'rgba(18, 18, 18, 0)');

        setChartData({
            labels: data.map(d => d.date),
            datasets: [
                {
                    label: `${symbol} Price`,
                    data: data.map(d => d.price),
                    borderColor: lineColor,
                    backgroundColor: gradientFill,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointBackgroundColor: lineColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                }
            ],
        });

    }, [data, range, symbol]);

    if (!data || data.length === 0) {
        return <div className="chart-loading">Loading chart data...</div>;
    }

    const timeRanges = [
        { label: '1D', value: '1d' },
        { label: '5D', value: '5d' },
        { label: '1M', value: '1mo' },
        { label: '6M', value: '6mo' },
        { label: 'YTD', value: 'ytd' },
        { label: '1Y', value: '1y' },
        { label: '5Y', value: '5y' },
        { label: 'Max', value: 'max' },
    ];

    /**
     * Format X-axis labels based on selected range.
     * Google Finance shows:
     *   1D/5D  → time (10:30 AM)
     *   1M     → "Feb 5"
     *   6M     → "Oct 2025"
     *   YTD/1Y → "Oct 2025"
     *   5Y/Max → "2023"
     */
    const formatXLabel = (dateStr) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

        if (range === '1d') {
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
        if (range === '5d') {
            return date.toLocaleDateString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
        }
        if (range === '1mo') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        if (range === '6mo' || range === 'ytd' || range === '1y') {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        // 5y, max → year only
        return date.getFullYear().toString();
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(32, 33, 36, 0.95)',
                titleColor: '#E8EAED',
                bodyColor: '#E8EAED',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                displayColors: false,
                padding: { x: 12, y: 8 },
                cornerRadius: 8,
                titleFont: { size: 11, weight: '400' },
                bodyFont: { size: 13, weight: '600' },
                callbacks: {
                    title: function (context) {
                        const dateStr = context[0].label;
                        const date = new Date(dateStr);
                        if (range === '1d' || range === '5d') {
                            return date.toLocaleString([], {
                                weekday: 'short', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            });
                        }
                        return date.toLocaleDateString('en-US', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        });
                    },
                    label: function (context) {
                        return `${context.parsed.y.toFixed(2)} USD`;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: '#9AA0A6',
                    maxTicksLimit: range === '1d' ? 6 : range === '5d' ? 5 : range === '1mo' ? 6 : 6,
                    maxRotation: 0,
                    font: { size: 12 },
                    padding: 8,
                    callback: function (value) {
                        const label = this.getLabelForValue(value);
                        return formatXLabel(label);
                    }
                }
            },
            y: {
                position: 'left',
                grid: {
                    color: 'rgba(60, 64, 67, 0.4)',
                    drawBorder: false,
                },
                border: { display: false },
                ticks: {
                    color: '#9AA0A6',
                    callback: (value) => value.toFixed(0),
                    font: { size: 12 },
                    padding: 8,
                    maxTicksLimit: 6,
                }
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <div className="price-chart-wrapper">
            <div className="chart-header-controls">
                <div className="time-selector">
                    {timeRanges.map((r) => (
                        <button
                            key={r.value}
                            className={`time-btn ${range === r.value ? 'active' : ''}`}
                            onClick={() => onRangeChange(r.value)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="chart-area">
                {chartData && <Line data={chartData} options={options} />}
            </div>
        </div>
    );
};

export default PriceChart;
