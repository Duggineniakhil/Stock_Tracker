import React, { useState, useEffect } from 'react';
import { fetchStockNews } from '../services/api';
import './NewsPanel.css';

/**
 * NewsPanel - displays recent stock-related news headlines.
 * Falls back gracefully if the news endpoint isn't available yet.
 */
const NewsPanel = ({ symbols = [] }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!symbols || symbols.length === 0) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(false);

        fetchStockNews(symbols.slice(0, 5))
            .then(res => {
                if (!cancelled) {
                    const data = res?.data || res || [];
                    setNews(Array.isArray(data) ? data.slice(0, 8) : []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(true);
                    setNews([]);
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [symbols.join(',')]);

    if (loading) {
        return (
            <div className="news-panel">
                <h3 className="news-title">📰 Market News</h3>
                <div className="news-loading">Loading news...</div>
            </div>
        );
    }

    if (error || news.length === 0) {
        return (
            <div className="news-panel">
                <h3 className="news-title">📰 Market News</h3>
                <div className="news-empty">
                    {error ? 'News feed temporarily unavailable.' : 'No news available for your watchlist.'}
                </div>
            </div>
        );
    }

    return (
        <div className="news-panel">
            <h3 className="news-title">📰 Market News</h3>
            <div className="news-list">
                {news.map((item, i) => (
                    <a
                        key={i}
                        href={item.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-item"
                    >
                        <div className="news-item-content">
                            <span className="news-source">{item.source || 'News'}</span>
                            <h4 className="news-headline">{item.title || item.headline}</h4>
                            {item.summary && (
                                <p className="news-summary">{item.summary.substring(0, 120)}...</p>
                            )}
                        </div>
                        {item.publishedAt && (
                            <span className="news-time">
                                {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default NewsPanel;
