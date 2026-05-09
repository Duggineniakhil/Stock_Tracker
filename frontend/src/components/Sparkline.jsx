import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { fetchStockHistory } from '../services/api';

Chart.register(...registerables);

const Sparkline = ({ symbol, trend, colorUp = '#00e887', colorDown = '#f05050' }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadHistory = async () => {
            try {
                const res = await fetchStockHistory(symbol, '1mo');
                if (isMounted) {
                    setHistory(res.data || []);
                }
            } catch (err) {
                console.error(`Failed to load history for ${symbol}`, err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadHistory();
        return () => { isMounted = false; };
    }, [symbol]);

    useEffect(() => {
        if (!loading && chartRef.current && history.length > 0) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            const isTrendPositive = trend === 'up';
            const color = isTrendPositive ? colorUp : colorDown;

            // Optional: You could use a gradient here too
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: history.map((_, i) => i),
                    datasets: [{
                        data: history.map(h => h.close),
                        borderColor: color,
                        borderWidth: 1.5,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false, min: Math.min(...history.map(h => h.close)) * 0.99 }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    animation: false
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [history, loading, trend, colorUp, colorDown]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {loading ? (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', color: 'var(--text-muted)' }}>...</div>
            ) : history.length > 0 ? (
                <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
            ) : (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', color: 'var(--text-muted)' }}>N/A</div>
            )}
        </div>
    );
};

export default Sparkline;
