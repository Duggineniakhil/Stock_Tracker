
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLatestAIReport, generateAIReport } from '../../services/api';
import './InsightCard.css';

interface AIReport {
    summary: string;
    content_html?: string;
    content?: string;
}

interface InsightCardProps {
    hasHoldings: boolean;
}

const ALLOWED_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'P', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'BR', 'SPAN', 'DIV', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD']);

// AI output is untrusted: keep a small set of formatting tags and drop every attribute
const sanitizeReportHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const clean = (node: Element) => {
        Array.from(node.children).forEach((child) => {
            if (!ALLOWED_TAGS.has(child.tagName)) {
                child.replaceWith(document.createTextNode(child.textContent || ''));
                return;
            }
            Array.from(child.attributes).forEach((attr) => child.removeAttribute(attr.name));
            clean(child);
        });
    };
    clean(doc.body);
    return doc.body.innerHTML;
};

const InsightCard = ({ hasHoldings }: InsightCardProps) => {
    const [report, setReport] = useState<AIReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadReport = async () => {
        try {
            const data = await fetchLatestAIReport();
            if (data.success) {
                setReport(data.report);
            }
        } catch {
            // 404 simply means no report has been generated yet
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const data = await generateAIReport();
            if (data.success) {
                setReport(data.report);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Couldn\'t generate a report right now. Please try again later.');
        } finally {
            setGenerating(false);
        }
    };

    const reportHtml = useMemo(
        () => sanitizeReportHtml(report?.content_html || report?.content || ''),
        [report]
    );

    if (loading) return <div className="insight-card loading">Analyzing Portfolio...</div>;

    return (
        <div className="insight-card reveal">
            <div className="ic-header">
                <div className="ic-badge">✨ AI Insights</div>
                {report && hasHoldings && (
                    <button
                        className="ic-refresh"
                        onClick={handleGenerate}
                        disabled={generating}
                    >
                        {generating ? 'Processing...' : 'New Report'}
                    </button>
                )}
            </div>

            {error && <div className="alert-banner error" role="alert">{error}</div>}

            {report ? (
                <div className="ic-content">
                    <h3 className="syne">Health Summary</h3>
                    <p className="small-text">{report.summary}</p>
                    <div
                        className="ic-body"
                        dangerouslySetInnerHTML={{ __html: reportHtml }}
                    />
                </div>
            ) : hasHoldings ? (
                <div className="ic-empty">
                    <p className="muted">Get an AI review of your portfolio's diversification, risk and performance.</p>
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                        {generating ? 'Analyzing...' : 'Generate First Report'}
                    </button>
                </div>
            ) : (
                <div className="ic-empty">
                    <p className="muted">AI reports analyze the holdings in your portfolio. Add at least one holding to generate your first report.</p>
                    <Link to="/portfolio?add=1" className="btn btn-outline">Go to Portfolio</Link>
                </div>
            )}
        </div>
    );
};

export default InsightCard;
