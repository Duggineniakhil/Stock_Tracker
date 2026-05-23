import React, { useState, useEffect } from 'react';
import { fetchAlertRules, createAlertRule, deleteAlertRule } from '../services/api';
import './Alerts.css';

const Alerts = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newRule, setNewRule] = useState({
        symbol: '',
        template_type: 'PERCENTAGE_CHANGE',
        condition_operator: 'ABOVE',
        condition_value: '',
        priority: 'MEDIUM'
    });

    const loadRules = async () => {
        try {
            setLoading(true);
            const res = await fetchAlertRules();
            setRules(res.data?.rules || res.rules || res || []);
        } catch (err) {
            console.error('Error fetching alert rules:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRules();
    }, []);

    const handleAddRule = async (e) => {
        e.preventDefault();
        try {
            await createAlertRule(newRule);
            setNewRule({ ...newRule, symbol: '', condition_value: '' });
            setShowAdd(false);
            loadRules();
        } catch (err) {
            console.error(err);
            alert('Failed to add alert rule. Check inputs.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this alert rule?')) return;
        try {
            await deleteAlertRule(id);
            loadRules();
        } catch (err) {
            alert('Failed to delete rule.');
        }
    };

    if (loading) return <div className="page-loader">Loading Alerts...</div>;

    return (
        <div className="alerts-page">
            <header className="alerts-header reveal">
                <div className="hbadge"><span className="ldot"></span> Monitoring Engine</div>
                <h1 className="h1" style={{ margin: 0 }}>Smart<br /><span className="g-text">Alerts.</span></h1>
                <div style={{ marginTop: 'var(--sp-24)' }}>
                    <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
                        {showAdd ? 'Close' : '+ Create Rule'}
                    </button>
                </div>
            </header>

            {showAdd && (
                <div className="card reveal add-card" style={{ marginBottom: 'var(--sp-48)' }}>
                    <form className="add-rule-form" onSubmit={handleAddRule}>
                        <div className="input-group">
                            <label>Symbol</label>
                            <input 
                                type="text" 
                                placeholder="AAPL" 
                                required 
                                value={newRule.symbol} 
                                onChange={e => setNewRule({...newRule, symbol: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="input-group">
                            <label>Type</label>
                            <select 
                                value={newRule.template_type}
                                onChange={e => setNewRule({...newRule, template_type: e.target.value})}
                            >
                                <option value="PERCENTAGE_CHANGE">Percentage Change</option>
                                <option value="TARGET_PRICE">Target Price</option>
                                <option value="VOLUME_SPIKE">Volume Spike</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Condition</label>
                            <select 
                                value={newRule.condition_operator}
                                onChange={e => setNewRule({...newRule, condition_operator: e.target.value})}
                            >
                                <option value="ABOVE">Above / Greater Than</option>
                                <option value="BELOW">Below / Less Than</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Value</label>
                            <input 
                                type="number" 
                                step="any" 
                                placeholder={newRule.template_type === 'PERCENTAGE_CHANGE' ? 'e.g. 5 (%)' : 'e.g. 150.00'} 
                                required 
                                value={newRule.condition_value} 
                                onChange={e => setNewRule({...newRule, condition_value: e.target.value})}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '48px' }}>Save Rule</button>
                    </form>
                </div>
            )}

            <div className="sec-label">Active Monitoring Rules</div>
            
            <div className="rules-grid reveal">
                {rules.length > 0 ? rules.map((r, i) => (
                    <div className="rule-card" key={r.id || i}>
                        <div className="rule-header">
                            <div className="rule-symbol">{r.symbol}</div>
                            <div className="rule-type">{r.template_type.replace('_', ' ')}</div>
                        </div>
                        <div className="rule-details">
                            <div>
                                <span className="muted">Trigger when </span>
                                <span className="rule-condition">{r.template_type === 'TARGET_PRICE' ? 'Price is' : 'Move is'} {r.condition_operator.toLowerCase()} </span>
                                <span className="rule-value">
                                    {r.template_type === 'PERCENTAGE_CHANGE' ? `${r.condition_value}%` : `$${r.condition_value}`}
                                </span>
                            </div>
                        </div>
                        <div className="rule-actions">
                            <button className="rule-delete" onClick={() => handleDelete(r.id)}>
                                Delete Rule
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="card muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--sp-48)' }}>
                        You have no active alert rules. Create one to monitor price movements automatically.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alerts;
