import React, { useState } from 'react';
import './PortfolioList.css';

const PortfolioList = ({ holdings, onDelete, onUpdate, loading }) => {
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleDelete = (id) => {
        if (deleteConfirm === id) {
            onDelete(id);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(id);
            // Auto-cancel after 3 seconds
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="portfolio-list">
                <h3>Holdings</h3>
                <div className="holdings-table skeleton">
                    <div className="skeleton-row"></div>
                    <div className="skeleton-row"></div>
                    <div className="skeleton-row"></div>
                </div>
            </div>
        );
    }

    if (!holdings || holdings.length === 0) {
        return (
            <div className="portfolio-list">
                <h3>Holdings</h3>
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No holdings yet</p>
                    <span>Add your first holding using the form above</span>
                </div>
            </div>
        );
    }

    return (
        <div className="portfolio-list">
            <h3>Holdings ({holdings.length})</h3>

            {/* Desktop Table View */}
            <div className="holdings-table desktop-only">
                <div className="table-header">
                    <div>Symbol</div>
                    <div>Quantity</div>
                    <div>Buy Price</div>
                    <div>Current Price</div>
                    <div>Investment</div>
                    <div>Current Value</div>
                    <div>P/L ($)</div>
                    <div>P/L (%)</div>
                    <div>Actions</div>
                </div>

                {holdings.map((holding) => {
                    const isProfit = holding.profitLoss >= 0;
                    return (
                        <div key={holding.id} className="table-row">
                            <div className="symbol">{holding.symbol}</div>
                            <div>{holding.quantity}</div>
                            <div>${holding.buy_price.toFixed(2)}</div>
                            <div>${holding.currentPrice?.toFixed(2) || '—'}</div>
                            <div>${holding.totalInvestment?.toLocaleString()}</div>
                            <div>${holding.currentValue?.toLocaleString()}</div>
                            <div className={isProfit ? 'profit' : 'loss'}>
                                {isProfit ? '+' : ''}${holding.profitLoss?.toFixed(2)}
                            </div>
                            <div className={isProfit ? 'profit' : 'loss'}>
                                {isProfit ? '+' : ''}{holding.profitLossPercent?.toFixed(2)}%
                            </div>
                            <div className="actions">
                                <button
                                    onClick={() => handleDelete(holding.id)}
                                    className={`delete-btn ${deleteConfirm === holding.id ? 'confirm' : ''}`}
                                    title={deleteConfirm === holding.id ? 'Click again to confirm' : 'Delete'}
                                >
                                    {deleteConfirm === holding.id ? '✓' : '🗑️'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Card View */}
            <div className="holdings-cards mobile-only">
                {holdings.map((holding) => {
                    const isProfit = holding.profitLoss >= 0;
                    return (
                        <div key={holding.id} className="holding-card">
                            <div className="card-header">
                                <div className="symbol">{holding.symbol}</div>
                                <button
                                    onClick={() => handleDelete(holding.id)}
                                    className={`delete-btn ${deleteConfirm === holding.id ? 'confirm' : ''}`}
                                >
                                    {deleteConfirm === holding.id ? '✓ Confirm' : '🗑️'}
                                </button>
                            </div>

                            <div className="card-grid">
                                <div className="card-item">
                                    <span className="label">Quantity</span>
                                    <span className="value">{holding.quantity}</span>
                                </div>
                                <div className="card-item">
                                    <span className="label">Buy Price</span>
                                    <span className="value">${holding.buy_price.toFixed(2)}</span>
                                </div>
                                <div className="card-item">
                                    <span className="label">Current Price</span>
                                    <span className="value">${holding.currentPrice?.toFixed(2) || '—'}</span>
                                </div>
                                <div className="card-item">
                                    <span className="label">Investment</span>
                                    <span className="value">${holding.totalInvestment?.toLocaleString()}</span>
                                </div>
                                <div className="card-item">
                                    <span className="label">Current Value</span>
                                    <span className="value">${holding.currentValue?.toLocaleString()}</span>
                                </div>
                                <div className="card-item">
                                    <span className="label">P/L</span>
                                    <span className={`value ${isProfit ? 'profit' : 'loss'}`}>
                                        {isProfit ? '+' : ''}${holding.profitLoss?.toFixed(2)} ({isProfit ? '+' : ''}{holding.profitLossPercent?.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PortfolioList;
