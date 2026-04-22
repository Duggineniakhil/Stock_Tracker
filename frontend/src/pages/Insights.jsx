import React, { useState, useEffect } from 'react';
import { fetchAlerts } from '../services/api';
import './Insights.css';

const Insights = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getInsights = async () => {
            try {
                const res = await fetchAlerts(20);
                setAlerts(res.alerts || res.data || []);
            } catch (err) {
                console.error('Error fetching insights:', err);
            } finally {
                setLoading(false);
            }
        };
        getInsights();
    }, []);

    if (loading) return <div className="page-loader"><span className="animate-up">ANALYZING...</span></div>;

    const mockSignals = [
        {
            tag: 'Bullish signal',
            tagClass: 'tag-bull',
            title: 'NVDA breaks resistance at $860 — momentum building',
            body: 'NVIDIA crossed its 50-day moving average on strong volume. Analysts see potential upside toward the $920 range over the next 2 weeks.',
            meta: 'System · 2 min read'
        },
        {
            tag: 'Watch closely',
            tagClass: 'tag-warn',
            title: 'TSLA dips ahead of earnings — volatility expected',
            body: 'Tesla reports earnings next week. Historical data shows 8–12% swings post-announcement. Consider your position size carefully.',
            meta: 'Quotra AI · 5 min read'
        }
    ];

    return (
        <div className="insights-page container">
            <header className="dashboard-header animate-up">
                <div className="hbadge"><span className="ldot"></span> Signal Detection</div>
                <h1>Market<br /><span className="g-text">Insights.</span></h1>
            </header>

            <div className="ins-grid animate-up" style={{ animationDelay: '0.1s' }}>
                {mockSignals.map((s, i) => (
                    <div className="glass-card ins-card" key={i}>
                        <div className={`ins-tag ${s.tagClass}`}>{s.tag}</div>
                        <h3 className="ins-title">{s.title}</h3>
                        <p className="ins-body">{s.body}</p>
                        <div className="ins-meta">{s.meta}</div>
                    </div>
                ))}

                {alerts.length > 0 ? alerts.map((a, i) => (
                    <div className="glass-card ins-card" key={a._id || i}>
                        <div className="ins-tag tag-info">Price Target</div>
                        <h3 className="ins-title">{a.symbol} reached target of ${a.targetPrice?.toFixed(2)}</h3>
                        <p className="ins-body">
                            The stock has crossed the alert threshold. Current recorded price at trigger was ${a.triggerPrice?.toFixed(2)}.
                        </p>
                        <div className="ins-meta">{new Date(a.createdAt).toLocaleDateString()} · System Alert</div>
                    </div>
                )  ) : (
                    <div className="glass-card" style={{ borderStyle: 'dashed', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                        <div className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                            Your custom alerts will appear here once triggered.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Insights;
