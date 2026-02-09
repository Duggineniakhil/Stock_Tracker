import React from 'react';
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler
);

const StockListItem = ({ stock, isSelected, onClick, onRemove }) => {
    const isPositive = stock.change >= 0;
    const color = isPositive ? '#34A853' : '#EA4335';

    // Mock data for sparkline (since we might not have history for all stocks in the list immediately)
    // In a real app, we'd fetch this or pass it down. 
    // For now, we'll use a simple random array seeded by the price to look different but consistent
    const sparklineData = {
        labels: Array(20).fill(''),
        datasets: [
            {
                data: Array.from({ length: 20 }, () => stock.currentPrice * (1 + (Math.random() - 0.5) * 0.1)),
                borderColor: color,
                borderWidth: 1.5,
                tension: 0.4,
                pointRadius: 0,
                fill: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: { display: false },
            y: { display: false },
        },
        animation: false,
    };

    return (
        <div
            className={`stock-list-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onClick(stock)}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                borderLeft: isSelected ? '3px solid #8AB4F8' : '3px solid transparent',
                transition: 'background-color 0.2s',
            }}
        >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{stock.symbol}</span>
                <span style={{ fontSize: '0.8rem', color: isPositive ? '#34A853' : '#EA4335' }}>
                    {isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                </span>
            </div>

            <div style={{ width: '60px', height: '30px', margin: '0 12px' }}>
                <Line data={sparklineData} options={options} />
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 400, fontSize: '0.95rem' }}>${stock.currentPrice?.toFixed(2)}</span>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onRemove(stock.id); }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#5F6368',
                    marginLeft: '12px',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.6,
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.6'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
};

export default StockListItem;
