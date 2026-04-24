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
                // Standardized wrapper has actual payload in .data
                setAlerts(res.data?.alerts || res.data || []);
            } catch (err) {
                console.error('Error fetching insights:', err);
            } finally {
                setLoading(false);
            }
        };
        getInsights();
    }, []);

    if (loading) return <div className="page-loader">Gathering Market Intel...</div>;

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
        <div className="insights-page">
            <header className="reveal" style={{ paddingTop: 'var(--sp-48)', paddingBottom: 'var(--sp-32)' }}>
                <div className="hbadge"><span className="ldot"></span> Signal Detection</div>
                <h1 className="h1" style={{ margin: 0 }}>Market<br /><span className="g-text">Insights.</span></h1>
            </header>

            <div className="ins-grid">
                {mockSignals.map((s, i) => (
                    <div className="ins-card" key={i}>
                        <div className={`ins-tag ${s.tagClass}`}>{s.tag}</div>
                        <div className="ins-title">{s.title}</div>
                        <div className="ins-body">{s.body}</div>
                        <div className="ins-meta">{s.meta}</div>
                    </div>
                ))}

                {alerts.length > 0 ? alerts.map((a, i) => (
                    <div className="ins-card" key={a._id || i}>
                        <div className="ins-tag tag-info">Price Target</div>
                        <div className="ins-title">{a.symbol} reached target of ${a.targetPrice?.toFixed(2)}</div>
                        <div className="ins-body">
                            The stock has crossed the alert threshold. Current recorded price at trigger was ${a.triggerPrice?.toFixed(2)}.
                        </div>
                        <div className="ins-meta">{new Date(a.createdAt).toLocaleDateString()} · System Alert</div>
                    </div>
                )  ) : (
                    <div className="ins-card" style={{ borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
                        <div className="muted" style={{ textAlign: 'center', padding: 'var(--sp-16)' }}>
                            Your custom alerts will appear here once triggered.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Insights;
