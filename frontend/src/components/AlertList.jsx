import React from 'react';
import './AlertList.css';

const AlertList = ({ alerts, loading }) => {
    if (loading) {
        return (
            <div className="alert-list">
                <h2>Recent Alerts</h2>
                <div className="loading">Loading alerts...</div>
            </div>
        );
    }

    if (!alerts || alerts.length === 0) {
        return (
            <div className="alert-list">
                <h2>Recent Alerts</h2>
                <div className="empty-state">No alerts yet. Alerts will appear when price movements are detected.</div>
            </div>
        );
    }

    const getAlertIcon = (alertType) => {
        switch (alertType) {
            case 'PRICE_DROP':
                return '📉';
            case 'MA_CROSSOVER_UP':
                return '📈';
            case 'MA_CROSSOVER_DOWN':
                return '📊';
            default:
                return '🔔';
        }
    };

    const getAlertClass = (alertType) => {
        switch (alertType) {
            case 'PRICE_DROP':
                return 'alert-danger';
            case 'MA_CROSSOVER_UP':
                return 'alert-success';
            case 'MA_CROSSOVER_DOWN':
                return 'alert-warning';
            default:
                return 'alert-info';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="alert-list">
            <h2>Recent Alerts</h2>
            <div className="alerts-container">
                {alerts.map((alert) => (
                    <div key={alert.id} className={`alert-item ${getAlertClass(alert.alertType)}`}>
                        <div className="alert-icon">{getAlertIcon(alert.alertType)}</div>
                        <div className="alert-content">
                            <div className="alert-message">{alert.message}</div>
                            <div className="alert-meta">
                                <span className="alert-symbol">{alert.symbol}</span>
                                <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertList;
