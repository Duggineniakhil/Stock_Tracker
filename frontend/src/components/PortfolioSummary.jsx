import React from 'react';
import './PortfolioSummary.css';

const PortfolioSummary = ({ summary, loading }) => {
    if (loading) {
        return (
            <div className="portfolio-summary">
                <div className="summary-card skeleton"></div>
                <div className="summary-card skeleton"></div>
                <div className="summary-card skeleton"></div>
                <div className="summary-card skeleton"></div>
            </div>
        );
    }

    const isProfitable = summary?.totalProfitLoss >= 0;

    return (
        <div className="portfolio-summary">
            <div className="summary-card primary">
                <div className="card-icon">💼</div>
                <div className="card-content">
                    <div className="card-label">Total Portfolio Value</div>
                    <div className="card-value large">${summary?.totalCurrentValue?.toLocaleString() || '0.00'}</div>
                </div>
            </div>

            <div className="summary-card">
                <div className="card-icon">💰</div>
                <div className="card-content">
                    <div className="card-label">Total Investment</div>
                    <div className="card-value">${summary?.totalInvestment?.toLocaleString() || '0.00'}</div>
                </div>
            </div>

            <div className={`summary-card ${isProfitable ? 'profit' : 'loss'}`}>
                <div className="card-icon">{isProfitable ? '📈' : '📉'}</div>
                <div className="card-content">
                    <div className="card-label">Total P/L</div>
                    <div className="card-value">
                        {isProfitable ? '+' : ''}${summary?.totalProfitLoss?.toLocaleString() || '0.00'}
                    </div>
                    <div className="card-percent">
                        ({isProfitable ? '+' : ''}{summary?.totalProfitLossPercent?.toFixed(2) || '0.00'}%)
                    </div>
                </div>
            </div>

            <div className="summary-card">
                <div className="card-icon">📊</div>
                <div className="card-content">
                    <div className="card-label">Holdings</div>
                    <div className="card-value">{summary?.totalHoldings || 0}</div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioSummary;
