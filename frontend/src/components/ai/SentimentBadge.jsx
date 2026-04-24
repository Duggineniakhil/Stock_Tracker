import React, { useState, useEffect } from 'react';
import { fetchStockSentiment } from '../../services/api';
import './SentimentBadge.css';

const SentimentBadge = ({ symbol }) => {
    const [sentiment, setSentiment] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getSentiment = async () => {
            if (!symbol) return;
            setLoading(true);
            try {
                const data = await fetchStockSentiment(symbol);
                if (data.success) {
                    setSentiment(data.overall);
                }
            } catch (err) {
                console.error('Sentiment fetch failed', err);
            } finally {
                setLoading(false);
            }
        };
        getSentiment();
    }, [symbol]);

    if (loading) return <div className="sb-loading">...</div>;
    if (!sentiment) return null;

    const { label, score } = sentiment;
    const isBullish = label === 'bullish';
    const isBearish = label === 'bearish';

    return (
        <div className={`sentiment-badge ${label}`} title={`Sentiment Score: ${score}`}>
            <span className="sb-icon">
                {isBullish ? '🚀' : isBearish ? '⚠️' : '📊'}
            </span>
            <span className="sb-text">
                {label.charAt(0).toUpperCase() + label.slice(1)}
            </span>
        </div>
    );
};

export default SentimentBadge;
