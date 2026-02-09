import React, { useEffect, useRef, useState } from 'react';
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
    const chartRef = useRef(null);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);

        const isPositive = data[data.length - 1].price >= data[0].price;
        const color = isPositive ? 'rgba(52, 168, 83, 0.5)' : 'rgba(234, 67, 53, 0.5)';
        const lineColor = isPositive ? '#34A853' : '#EA4335';

        gradientFill.addColorStop(0, color);
        gradientFill.addColorStop(1, 'rgba(18, 18, 18, 0)');

        setChartData({
            labels: data.map(d => d.date), // Store raw ISO strings
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
                    pointHoverRadius: 6,
                    pointBackgroundColor: lineColor,
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
        { label: 'MAX', value: 'max' },
    ];

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#2A2A2A',
                titleColor: '#E8EAED',
                bodyColor: '#E8EAED',
                borderColor: '#3C4043',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    title: function (context) {
                        // Full date time for tooltip
                        const dateStr = context[0].label;
                        const date = new Date(dateStr);
                        return date.toLocaleString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    },
                    label: function (context) {
                        return `$${context.parsed.y.toFixed(2)}`;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#9AA0A6',
                    maxTicksLimit: 7, // Limit ticks to keep it clean
                    maxRotation: 0,
                    font: { size: 11 },
                    callback: function (value, index, values) {
                        const label = this.getLabelForValue(value);
                        const date = new Date(label);

                        // Dynamic formatting based on range
                        if (range === '1d' || range === '5d') {
                            // Show Time
                            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        } else if (range === '1mo' || range === '6mo') {
                            // Show Day Month
                            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        } else if (range === 'ytd' || range === '1y') {
                            // Show Month
                            return date.toLocaleDateString([], { month: 'short' });
                        } else {
                            // MAX: Show Year
                            return date.getFullYear();
                        }
                    }
                }
            },
            y: {
                position: 'right',
                grid: {
                    color: '#3C4043',
                    borderDash: [4, 4],
                    drawBorder: false,
                },
                ticks: {
                    color: '#9AA0A6',
                    callback: (value) => '$' + value.toFixed(0),
                    font: { size: 11 }
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

            <div className="chart-area" style={{ height: '400px', width: '100%', marginTop: '20px' }}>
                {chartData && <Line data={chartData} options={options} />}
            </div>
        </div>
    );
};

export default PriceChart;
