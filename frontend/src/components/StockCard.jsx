import React from 'react';
import './StockCard.css';

const StockCard = ({ stock, onRemove }) => {
    const isPositive = stock.changePercent >= 0;

    return (
        <div className="stock-card">
            <div className="stock-card-header">
                <div>
                    <h3 className="stock-symbol">{stock.symbol}</h3>
                    <p className="stock-name">{stock.name}</p>
                </div>
                <button
                    className="remove-btn"
                    onClick={() => onRemove(stock.id)}
                    title="Remove from watchlist"
                >
                    ✕
                </button>
            </div>

            <div className="stock-price">
                <span className="price-value">${stock.currentPrice?.toFixed(2)}</span>
                <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(stock.changePercent)?.toFixed(2)}%
                </span>
            </div>

            <div className="stock-details">
                <div className="detail-item">
                    <span className="detail-label">High</span>
                    <span className="detail-value">${stock.dayHigh?.toFixed(2)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Low</span>
                    <span className="detail-value">${stock.dayLow?.toFixed(2)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Prev Close</span>
                    <span className="detail-value">${stock.previousClose?.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default StockCard;
