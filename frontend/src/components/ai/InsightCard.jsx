import React, { useState, useEffect } from 'react';
import { fetchLatestAIReport, generateAIReport } from '../../services/api';
import './InsightCard.css';

const InsightCard = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const loadReport = async () => {
        try {
            const data = await fetchLatestAIReport();
            if (data.success) {
                setReport(data.report);
            }
        } catch (err) {
            console.error('No AI reports found');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const data = await generateAIReport();
            if (data.success) {
                setReport(data.report);
            }
        } catch (err) {
            alert('Failed to generate AI report. Ensure you have holdings in your portfolio.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="insight-card loading">Analyzing Portfolio...</div>;

    return (
        <div className="insight-card reveal">
            <div className="ic-header">
                <div className="ic-badge">✨ AI Insights</div>
                <button 
                    className="ic-refresh" 
                    onClick={handleGenerate}
                    disabled={generating}
                >
                    {generating ? 'Processing...' : 'New Report'}
                </button>
            </div>

            {report ? (
                <div className="ic-content">
                    <h3 className="syne">Health Summary</h3>
                    <p className="small-text">{report.summary}</p>
                    <div 
                        className="ic-body" 
                        dangerouslySetInnerHTML={{ __html: report.content_html }}
                    />
                </div>
            ) : (
                <div className="ic-empty">
                    <p className="muted">No portfolio insights generated yet.</p>
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                        {generating ? 'Analyzing...' : 'Generate First Report'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default InsightCard;
