import React, { useState, useEffect } from 'react';
import { fetchAlerts, fetchPortfolio, fetchStockSentiment } from '../services/api';
import './Insights.css';

const Insights = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [signals, setSignals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getInsights = async () => {
            try {
                // Fetch alerts
                const alertsRes = await fetchAlerts(20);
                setAlerts(alertsRes.data?.alerts || alertsRes.data || []);

                // Fetch portfolio to get top symbols for sentiment analysis
                const portfolioRes = await fetchPortfolio();
                const holdings = portfolioRes.data || [];
                
                // Get top 2 holdings by value
                const topSymbols = holdings
                    .sort((a, b) => (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity))
                    .slice(0, 2)
                    .map(h => h.symbol);

                // If portfolio is empty, fallback to some popular symbols
                const symbolsToAnalyze = topSymbols.length > 0 ? topSymbols : ['AAPL', 'MSFT'];

                const sentiments = await Promise.all(symbolsToAnalyze.map(sym => fetchStockSentiment(sym).catch(() => null)));
                
                const generatedSignals: any[] = [];
                sentiments.forEach(res => {
                    if (res && res.success && res.details) {
                        res.details.forEach(detail => {
                            let tagClass = 'tag-info';
                            if (detail.sentiment === 'bullish') tagClass = 'tag-bull';
                            if (detail.sentiment === 'bearish') tagClass = 'tag-warn';

                            generatedSignals.push({
                                tag: `${detail.sentiment.charAt(0).toUpperCase() + detail.sentiment.slice(1)} Signal`,
                                tagClass,
                                title: detail.headline,
                                body: `AI Analysis indicates a ${detail.sentiment} trend for ${res.symbol} based on recent market activity with a confidence score of ${(detail.score * 100).toFixed(0)}%.`,
                                meta: 'Quotra AI · Real-time'
                            });
                        });
                    }
                });

                setSignals(generatedSignals);
            } catch (err) {
                console.error('Error fetching insights:', err);
            } finally {
                setLoading(false);
            }
        };
        getInsights();
    }, []);

    if (loading) return <div className="page-loader">Gathering Market Intel...</div>;

    return (
        <div className="insights-page">
            <header className="reveal" style={{ paddingTop: 'var(--sp-48)', paddingBottom: 'var(--sp-32)' }}>
                <div className="hbadge"><span className="ldot"></span> Signal Detection</div>
                <h1 className="h1" style={{ margin: 0 }}>Market<br /><span className="g-text">Insights.</span></h1>
            </header>

            <div className="ins-grid">
                {signals.length > 0 ? signals.map((s, i) => (
                    <div className="ins-card reveal" key={`sig-${i}`}>
                        <div className={`ins-tag ${s.tagClass}`}>{s.tag}</div>
                        <div className="ins-title">{s.title}</div>
                        <div className="ins-body">{s.body}</div>
                        <div className="ins-meta">{s.meta}</div>
                    </div>
                )) : (
                    <div className="ins-card" style={{ borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
                        <div className="muted" style={{ textAlign: 'center', padding: 'var(--sp-16)' }}>
                            No AI signals available right now.
                        </div>
                    </div>
                )}

                {alerts.length > 0 ? alerts.map((a, i) => (
                    <div className="ins-card reveal" key={`alt-${a.id || i}`}>
                        <div className="ins-tag tag-info">{a.alertType || 'System Alert'}</div>
                        <div className="ins-title">{a.symbol} triggered an alert</div>
                        <div className="ins-body">{a.message}</div>
                        {a.reason && <div className="ins-body muted" style={{ marginTop: '8px', fontStyle: 'italic' }}>"{a.reason}"</div>}
                        <div className="ins-meta">{new Date(a.timestamp || a.createdAt).toLocaleString()}</div>
                    </div>
                )) : (
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
