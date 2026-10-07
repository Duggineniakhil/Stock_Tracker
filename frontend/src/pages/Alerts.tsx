import React, { useState, useEffect } from 'react';
import { fetchAlertRules, createAlertRule, deleteAlertRule } from '../services/api';
import './Alerts.css';

type RuleType = 'PERCENTAGE_CHANGE' | 'TARGET_PRICE' | 'VOLUME_SPIKE';

// How each rule type is evaluated by the alert engine, so the form only asks for what matters
const RULE_TYPES: Record<RuleType, { label: string; valueLabel: string; placeholder: string; hint: string; step: string; min: string }> = {
    PERCENTAGE_CHANGE: {
        label: 'Daily % move',
        valueLabel: 'Move size (%)',
        placeholder: 'e.g. 5',
        hint: 'Triggers when the stock moves this much in a day, up or down.',
        step: '0.1',
        min: '0.1',
    },
    TARGET_PRICE: {
        label: 'Target price',
        valueLabel: 'Price ($)',
        placeholder: 'e.g. 150.00',
        hint: 'Triggers when the price crosses your target.',
        step: '0.01',
        min: '0.01',
    },
    VOLUME_SPIKE: {
        label: 'Volume spike',
        valueLabel: 'Times average volume',
        placeholder: 'e.g. 2',
        hint: 'Triggers when trading volume exceeds this multiple of the average.',
        step: '0.1',
        min: '1',
    },
};

const describeRule = (r: any) => {
    switch (r.template_type) {
        case 'TARGET_PRICE':
            return <>Price goes <span className="rule-condition">{r.condition_operator === 'BELOW' ? 'below' : 'above'}</span> <span className="rule-value">${r.condition_value}</span></>;
        case 'PERCENTAGE_CHANGE':
            return <>Price moves <span className="rule-value">±{r.condition_value}%</span> in a day</>;
        case 'VOLUME_SPIKE':
            return <>Volume exceeds <span className="rule-value">{r.condition_value}×</span> average</>;
        default:
            return <>{String(r.template_type).replace(/_/g, ' ').toLowerCase()} {r.condition_operator?.toLowerCase()} <span className="rule-value">{r.condition_value}</span></>;
    }
};

const emptyRule = { symbol: '', template_type: 'PERCENTAGE_CHANGE' as RuleType, condition_operator: 'ABOVE', condition_value: '', priority: 'MEDIUM' };

const Alerts = () => {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [newRule, setNewRule] = useState(emptyRule);

    const loadRules = async () => {
        try {
            const res = await fetchAlertRules();
            setRules(res.data?.rules || res.rules || res.data || []);
            setLoadError(null);
        } catch (err) {
            console.error('Error fetching alert rules:', err);
            setLoadError('We couldn\'t load your alert rules. Please refresh the page to try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRules();
    }, []);

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSaving(true);
        try {
            // Only target-price rules use a direction; other types are evaluated either way
            await createAlertRule({
                ...newRule,
                symbol: newRule.symbol.trim(),
                condition_operator: newRule.template_type === 'TARGET_PRICE' ? newRule.condition_operator : 'ABOVE',
            });
            setNewRule({ ...emptyRule, template_type: newRule.template_type });
            setShowAdd(false);
            await loadRules();
        } catch (err: any) {
            setFormError(
                err?.response?.data?.error?.message
                || err?.response?.data?.message
                || 'Couldn\'t save this rule. Check the symbol and value and try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (rule: any) => {
        if (!window.confirm(`Delete the ${rule.symbol} alert rule?`)) return;
        setActionError(null);
        try {
            await deleteAlertRule(rule.id);
            setRules(prev => prev.filter(r => r.id !== rule.id));
        } catch {
            setActionError(`Couldn't delete the ${rule.symbol} rule. Please try again.`);
        }
    };

    if (loading) return <div className="page-loader">Loading Alerts...</div>;

    const typeConfig = RULE_TYPES[newRule.template_type];

    return (
        <div className="alerts-page">
            <header className="alerts-header reveal">
                <div className="hbadge"><span className="ldot"></span> Monitoring Engine</div>
                <h1 className="h1" style={{ margin: 0 }}>Smart<br /><span className="g-text">Alerts.</span></h1>
                <p className="small-text" style={{ marginTop: 'var(--sp-16)', maxWidth: '560px' }}>
                    Rules are checked every hour. Triggered alerts show up in the notification bell and on the Insights page.
                </p>
                <div style={{ marginTop: 'var(--sp-24)' }}>
                    <button className="btn btn-primary" onClick={() => { setShowAdd(!showAdd); setFormError(null); }} aria-expanded={showAdd}>
                        {showAdd ? 'Close' : '+ Create Rule'}
                    </button>
                </div>
            </header>

            {loadError && <div className="alert-banner error" role="alert">{loadError}</div>}
            {actionError && <div className="alert-banner error" role="alert">{actionError}</div>}

            {showAdd && (
                <div className="card reveal add-card" style={{ marginBottom: 'var(--sp-48)' }}>
                    <form className="add-rule-form" onSubmit={handleAddRule}>
                        <div className="input-group">
                            <label htmlFor="rule-symbol">Symbol</label>
                            <input
                                id="rule-symbol"
                                type="text"
                                placeholder="AAPL"
                                required
                                autoFocus
                                autoComplete="off"
                                value={newRule.symbol}
                                onChange={e => setNewRule({ ...newRule, symbol: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="rule-type">Alert type</label>
                            <select
                                id="rule-type"
                                value={newRule.template_type}
                                onChange={e => setNewRule({ ...newRule, template_type: e.target.value as RuleType, condition_value: '' })}
                            >
                                {(Object.keys(RULE_TYPES) as RuleType[]).map(t => (
                                    <option key={t} value={t}>{RULE_TYPES[t].label}</option>
                                ))}
                            </select>
                        </div>
                        {newRule.template_type === 'TARGET_PRICE' && (
                            <div className="input-group">
                                <label htmlFor="rule-direction">When price goes</label>
                                <select
                                    id="rule-direction"
                                    value={newRule.condition_operator}
                                    onChange={e => setNewRule({ ...newRule, condition_operator: e.target.value })}
                                >
                                    <option value="ABOVE">Above target</option>
                                    <option value="BELOW">Below target</option>
                                </select>
                            </div>
                        )}
                        <div className="input-group">
                            <label htmlFor="rule-value">{typeConfig.valueLabel}</label>
                            <input
                                id="rule-value"
                                type="number"
                                step={typeConfig.step}
                                min={typeConfig.min}
                                placeholder={typeConfig.placeholder}
                                required
                                aria-describedby="rule-hint"
                                value={newRule.condition_value}
                                onChange={e => setNewRule({ ...newRule, condition_value: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '52px' }} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Rule'}
                        </button>
                    </form>
                    <p id="rule-hint" className="input-hint" style={{ marginTop: 'var(--sp-12)' }}>{typeConfig.hint}</p>
                    {formError && <div className="alert-banner error" role="alert">{formError}</div>}
                </div>
            )}

            <div className="sec-label">Active Monitoring Rules</div>

            {rules.length > 0 ? (
                <div className="rules-grid reveal">
                    {rules.map((r, i) => (
                        <div className="rule-card" key={r.id || i}>
                            <div className="rule-header">
                                <div className="rule-symbol">{r.symbol}</div>
                                <div className="rule-type">{RULE_TYPES[r.template_type as RuleType]?.label || String(r.template_type).replace(/_/g, ' ')}</div>
                            </div>
                            <div className="rule-details">
                                <span className="muted">Alert me when </span>
                                {describeRule(r)}
                            </div>
                            <div className="rule-actions">
                                <button className="rule-delete" onClick={() => handleDelete(r)} aria-label={`Delete ${r.symbol} alert rule`}>
                                    Delete Rule
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <strong>No alert rules yet</strong>
                    <span>Create a rule to get notified when a stock hits a target price, makes a big move, or trades on unusual volume.</span>
                    {!showAdd && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Create your first rule</button>}
                </div>
            )}
        </div>
    );
};

export default Alerts;
