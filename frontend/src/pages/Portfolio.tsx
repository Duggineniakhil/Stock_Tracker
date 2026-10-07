import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPortfolio, fetchPortfolioAllocation, addHolding, deleteHolding, exportPortfolioCSV } from '../services/api';
import { Chart, registerables } from 'chart.js';
import './Portfolio.css';

Chart.register(...registerables);

const COLORS = ['#00e887', '#3882dc', '#f0a500', '#a66cff', '#ff6b8b', '#2ad4d4', '#ffd166', '#8fa3bf'];
const CONCENTRATION_THRESHOLD = 40;

const todayISO = () => new Date().toISOString().slice(0, 10);

const getApiErrorMessage = (err: any, fallback: string) =>
    err?.response?.data?.message
    || err?.response?.data?.error?.message
    || err?.response?.data?.errors?.[0]?.message
    || fallback;

const getStrategyTip = (allocation: any[]) => {
    if (allocation.length === 0) return null;
    const top = allocation.reduce((a, b) => (b.percentage > a.percentage ? b : a));
    if (top.percentage >= CONCENTRATION_THRESHOLD) {
        return `${top.symbol} makes up ${top.percentage.toFixed(0)}% of your portfolio. Consider diversifying to reduce single-stock risk.`;
    }
    if (allocation.length < 5) {
        return `You hold ${allocation.length} asset${allocation.length === 1 ? '' : 's'}. Spreading across 5 or more positions in different sectors can lower volatility.`;
    }
    return 'Your holdings are well spread out. Review sector exposure periodically to keep it balanced.';
};

const Portfolio = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [holdings, setHoldings] = useState<any[]>([]);
    const [allocation, setAllocation] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(searchParams.get('add') === '1');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const chartRef = React.useRef<HTMLCanvasElement | null>(null);
    const chartInstance = React.useRef<any | null>(null);

    const [newAsset, setNewAsset] = useState({ symbol: '', quantity: '', buyPrice: '', buyDate: todayISO() });

    const loadData = async () => {
        try {
            const [pRes, aRes] = await Promise.all([
                fetchPortfolio(),
                fetchPortfolioAllocation()
            ]);
            setHoldings(pRes.data || []);
            setAllocation(aRes.data || []);
            setLoadError(null);
        } catch (err) {
            console.error('Error loading portfolio:', err);
            setLoadError('We couldn\'t load your portfolio. Please refresh the page to try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Opening via "Add your first holding" links uses ?add=1; clear it so a refresh doesn't reopen the form
        if (searchParams.get('add')) {
            setSearchParams({}, { replace: true });
        }
        return () => {
            chartInstance.current?.destroy();
            chartInstance.current = null;
        };
    }, []);

    useEffect(() => {
        // Always tear down the old chart so removing the last holding clears it
        chartInstance.current?.destroy();
        chartInstance.current = null;

        if (allocation.length === 0 || !chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: allocation.map(a => a.symbol),
                datasets: [{
                    data: allocation.map(a => a.percentage),
                    backgroundColor: allocation.map((_, i) => COLORS[i % COLORS.length]),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                cutout: '75%',
                plugins: {
                    legend: { display: false }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }, [allocation, loading]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            await addHolding(newAsset.symbol.trim(), parseFloat(newAsset.quantity), parseFloat(newAsset.buyPrice), newAsset.buyDate);
            setNewAsset({ symbol: '', quantity: '', buyPrice: '', buyDate: todayISO() });
            setShowAddForm(false);
            await loadData();
        } catch (err: any) {
            setFormError(getApiErrorMessage(err, 'Couldn\'t add this holding. Check the symbol and try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: any, symbol: string) => {
        if (!window.confirm(`Remove ${symbol} from your portfolio?`)) return;
        setActionError(null);
        try {
            await deleteHolding(id);
            await loadData();
        } catch (err) {
            setActionError(getApiErrorMessage(err, `Couldn't remove ${symbol}. Please try again.`));
        }
    };

    // Download through the authenticated API client so the token never appears in a URL
    const handleExport = async () => {
        setActionError(null);
        setExporting(true);
        try {
            const blob = await exportPortfolioCSV();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `quotra-portfolio-${todayISO()}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            setActionError('Couldn\'t export your portfolio. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <div className="page-loader">Loading Portfolio Details...</div>;

    const hasHoldings = holdings.length > 0;
    const strategyTip = getStrategyTip(allocation);

    return (
        <div className="portfolio-page">
            <header className="portfolio-header reveal">
                <div>
                    <div className="hbadge"><span className="ldot"></span> Assets & Allocation</div>
                    <h1 className="h1" style={{ margin: 0 }}>Detailed<br /><span className="g-text">Portfolio.</span></h1>
                </div>
                <div className="portfolio-actions">
                    <button
                        className="btn btn-outline"
                        onClick={handleExport}
                        disabled={!hasHoldings || exporting}
                        title={hasHoldings ? 'Download your holdings as a CSV file' : 'Add holdings to export'}
                    >
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => { setShowAddForm(!showAddForm); setFormError(null); }}
                        aria-expanded={showAddForm}
                    >
                        {showAddForm ? 'Close' : '+ Add Asset'}
                    </button>
                </div>
            </header>

            {loadError && <div className="alert-banner error" role="alert">{loadError}</div>}
            {actionError && <div className="alert-banner error" role="alert">{actionError}</div>}

            {showAddForm && (
                <div className="card reveal add-card">
                    <form className="add-asset-form" onSubmit={handleAdd}>
                        <div className="input-group">
                            <label htmlFor="asset-symbol">Symbol</label>
                            <input
                                id="asset-symbol"
                                type="text"
                                placeholder="AAPL"
                                required
                                autoFocus
                                autoComplete="off"
                                value={newAsset.symbol}
                                onChange={e => setNewAsset({ ...newAsset, symbol: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="asset-quantity">Quantity</label>
                            <input
                                id="asset-quantity"
                                type="number"
                                step="any"
                                min="0"
                                placeholder="10"
                                required
                                value={newAsset.quantity}
                                onChange={e => setNewAsset({ ...newAsset, quantity: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="asset-price">Buy Price ($)</label>
                            <input
                                id="asset-price"
                                type="number"
                                step="any"
                                min="0"
                                placeholder="150.00"
                                required
                                value={newAsset.buyPrice}
                                onChange={e => setNewAsset({ ...newAsset, buyPrice: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="asset-date">Buy Date</label>
                            <input
                                id="asset-date"
                                type="date"
                                max={todayISO()}
                                required
                                value={newAsset.buyDate}
                                onChange={e => setNewAsset({ ...newAsset, buyDate: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Adding...' : 'Add Asset'}
                        </button>
                    </form>
                    {formError && <div className="alert-banner error" role="alert">{formError}</div>}
                </div>
            )}

            <div className="portfolio-grid">
                <div className="holdings-section">
                    <div className="sec-label">My Holdings</div>
                    {hasHoldings ? holdings.map((h, i) => {
                        const holdingId = h.id || h._id;
                        const buyPrice = h.buyPrice ?? h.buy_price;
                        const openDetails = () => navigate(`/stock/${h.symbol}`);

                        return (
                            <div
                                className="holding-item clickable"
                                key={holdingId || i}
                                role="link"
                                tabIndex={0}
                                aria-label={`View ${h.symbol} details`}
                                onClick={openDetails}
                                onKeyDown={(e) => { if (e.key === 'Enter') openDetails(); }}
                            >
                                <div className="h-brand">
                                    <div className="h-icon-box">{h.symbol.substring(0, 2)}</div>
                                    <div>
                                        <div className="h-meta-name">{h.symbol}</div>
                                        <div className="h-meta-qty">{h.quantity} shares @ ${buyPrice?.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div className="h-data">
                                    <div className="h-price">${(h.currentPrice * h.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className={`h-change ${h.profitLossPercent >= 0 ? 'up' : 'dn'}`} title="Total return since purchase">
                                        {h.profitLossPercent >= 0 ? '+' : ''}{h.profitLossPercent?.toFixed(2)}%
                                        {' '}({h.profitLoss >= 0 ? '+' : '-'}${Math.abs(h.profitLoss ?? 0).toFixed(2)})
                                    </div>
                                    <button
                                        className="h-del"
                                        aria-label={`Remove ${h.symbol}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(holdingId, h.symbol);
                                        }}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="empty-state">
                            <strong>Your portfolio is empty</strong>
                            <span>Add a stock you own with its quantity and buy price to start tracking performance.</span>
                            {!showAddForm && (
                                <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>+ Add your first holding</button>
                            )}
                        </div>
                    )}
                </div>

                <div className="card allocation-card reveal">
                    <div className="allocation-title h2">
                        Current Allocation
                    </div>
                    {allocation.length > 0 ? (
                        <>
                            <div className="alloc-chart-box">
                                <canvas ref={chartRef} aria-label="Portfolio allocation chart" role="img"></canvas>
                                <div className="alloc-center-val">
                                    <span className="small-text muted">ASSETS</span>
                                    <span className="syne h3">{allocation.length}</span>
                                </div>
                            </div>
                            <div className="alloc-list">
                                {allocation.map((a, i) => (
                                    <div className="alloc-item" key={a.symbol}>
                                        <div className="alloc-info">
                                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.symbol}</span>
                                            <span className="muted">{a.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="alloc-bar-bg">
                                            <div
                                                className="alloc-bar-fill"
                                                style={{
                                                    width: `${a.percentage}%`,
                                                    background: COLORS[i % COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="muted small-text" style={{ textAlign: 'center', padding: 'var(--sp-32) 0' }}>
                            Your allocation breakdown will appear here once you add holdings.
                        </p>
                    )}
                    {strategyTip && (
                        <div className="strategy-card">
                            <div className="strat-lbl">STRATEGY TIP</div>
                            <div className="strat-body">{strategyTip}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Portfolio;
