import React from 'react';
import './TopPerformers.css';

const fmt = (n) => (typeof n === 'number' ? n.toFixed(2) : '0.00');

const TopPerformers = ({ watchlist }) => {
    const sorted = [...(watchlist || [])].sort((a, b) =>
        (b.changePercent || 0) - (a.changePercent || 0)
    );

    const gainers = sorted.slice(0, 3);
    const losers = sorted.slice(-3).reverse();

    const StockRow = ({ stock, type }) => {
        const isPositive = (stock.changePercent || 0) >= 0;
        return (
            <div className="performer-row">
                <div className="performer-left">
                    <div className="performer-symbol">{stock.symbol}</div>
                    <div className="performer-name">{stock.name?.split(' ')[0] || stock.symbol}</div>
                </div>
                <div className="performer-right">
                    <div className="performer-price">${fmt(stock.currentPrice)}</div>
                    <div className={`performer-change ${isPositive ? 'gain' : 'loss'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(stock.changePercent || 0).toFixed(2)}%
                    </div>
                </div>
            </div>
        );
    };

    if (watchlist?.length === 0) return null;

    return (
        <div className="top-performers">
            <div className="performers-col">
                <div className="performers-header"><span>🚀</span> Top Gainers</div>
                <div className="performers-list">
                    {gainers.filter(s => (s.changePercent || 0) >= 0).map(s => (
                        <StockRow key={s.id} stock={s} type="gain" />
                    ))}
                    {gainers.filter(s => (s.changePercent || 0) >= 0).length === 0 && (
                        <div className="empty-row">No gainers today</div>
                    )}
                </div>
            </div>
            <div className="performers-col">
                <div className="performers-header"><span>📉</span> Top Losers</div>
                <div className="performers-list">
                    {losers.filter(s => (s.changePercent || 0) < 0).map(s => (
                        <StockRow key={s.id} stock={s} type="loss" />
                    ))}
                    {losers.filter(s => (s.changePercent || 0) < 0).length === 0 && (
                        <div className="empty-row">No losers today</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopPerformers;
