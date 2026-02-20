import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchAlerts, fetchAlertRules, createAlertRule, updateAlertRule, deleteAlertRule, deleteAlert, clearAlertHistory } from '../services/api';
import './Alerts.css';

const PRIORITY_CONFIG = {
    LOW: { emoji: '🟢', label: 'Low', color: '#22c55e' },
    MEDIUM: { emoji: '🟡', label: 'Medium', color: '#eab308' },
    HIGH: { emoji: '🟠', label: 'High', color: '#f97316' },
    CRITICAL: { emoji: '🔴', label: 'Critical', color: '#ef4444' }
};

const TEMPLATE_CONFIG = {
    PERCENTAGE_CHANGE: { label: 'Price % Change', icon: '📈', unit: '%' },
    TARGET_PRICE: { label: 'Target Price', icon: '🎯', unit: '$' },
    VOLUME_SPIKE: { label: 'Volume Spike', icon: '📊', unit: '%' }
};

const initialRuleForm = {
    symbol: '', template_type: 'TARGET_PRICE', condition_operator: 'ABOVE',
    condition_value: '', priority: 'MEDIUM'
};

const Alerts = () => {
    const [activeTab, setActiveTab] = useState('history');
    const [alerts, setAlerts] = useState([]);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ruleForm, setRuleForm] = useState(initialRuleForm);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadAlerts = async () => {
        try {
            const data = await fetchAlerts(100, 0);
            setAlerts(data.alerts || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const loadRules = async () => {
        try {
            const data = await fetchAlertRules();
            setRules(data.rules || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { loadAlerts(); loadRules(); }, []);

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg); else setSuccess(msg);
        setTimeout(() => { setError(''); setSuccess(''); }, 3000);
    };

    const handleCreateRule = async (e) => {
        e.preventDefault();
        try {
            await createAlertRule({ ...ruleForm, condition_value: parseFloat(ruleForm.condition_value) });
            showMsg('Alert rule created!');
            setRuleForm(initialRuleForm);
            setShowCreateForm(false);
            loadRules();
        } catch (err) {
            showMsg(err.response?.data?.error?.message || 'Failed to create rule', true);
        }
    };

    const handleToggleRule = async (rule) => {
        try {
            await updateAlertRule(rule.id, { is_active: rule.is_active ? 0 : 1 });
            loadRules();
        } catch (e) { showMsg('Failed to update rule', true); }
    };

    const handleDeleteRule = async (id) => {
        try {
            await deleteAlertRule(id);
            showMsg('Rule deleted');
            loadRules();
        } catch (e) { showMsg('Failed to delete rule', true); }
    };

    const handleDeleteAlert = async (id) => {
        try {
            await deleteAlert(id);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (e) { showMsg('Failed to delete alert', true); }
    };

    const handleClearHistory = async () => {
        if (!confirm('Clear all alert history?')) return;
        try {
            await clearAlertHistory();
            setAlerts([]);
            showMsg('Alert history cleared');
        } catch (e) { showMsg('Failed to clear history', true); }
    };

    const tpl = TEMPLATE_CONFIG[ruleForm.template_type];

    return (
        <>
            <Navbar />
            <div className="alerts-page">
                <div className="alerts-header">
                    <div>
                        <h1 className="alerts-title">🔔 Alert Center</h1>
                        <p className="alerts-subtitle">Manage your price alerts and notification rules</p>
                    </div>
                    {activeTab === 'rules' && (
                        <button className="btn-create-rule" onClick={() => setShowCreateForm(!showCreateForm)}>
                            {showCreateForm ? '✕ Cancel' : '+ New Rule'}
                        </button>
                    )}
                    {activeTab === 'history' && alerts.length > 0 && (
                        <button className="btn-clear-history" onClick={handleClearHistory}>🗑 Clear All</button>
                    )}
                </div>

                {(error || success) && (
                    <div className={`toast ${error ? 'toast-error' : 'toast-success'}`}>
                        {error || success}
                    </div>
                )}

                {/* Tabs */}
                <div className="alerts-tabs">
                    <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        📋 History {alerts.length > 0 && <span className="badge">{alerts.length}</span>}
                    </button>
                    <button className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
                        ⚙️ Rules {rules.length > 0 && <span className="badge">{rules.length}</span>}
                    </button>
                </div>

                {/* Create Rule Form */}
                {activeTab === 'rules' && showCreateForm && (
                    <div className="create-rule-card">
                        <h3>Create Alert Rule</h3>
                        <form onSubmit={handleCreateRule} className="rule-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Stock Symbol</label>
                                    <input type="text" placeholder="e.g. AAPL" value={ruleForm.symbol}
                                        onChange={e => setRuleForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))}
                                        required maxLength={10} />
                                </div>
                                <div className="form-group">
                                    <label>Alert Template</label>
                                    <select value={ruleForm.template_type} onChange={e => setRuleForm(p => ({ ...p, template_type: e.target.value }))}>
                                        {Object.entries(TEMPLATE_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.icon} {v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Condition</label>
                                    <select value={ruleForm.condition_operator} onChange={e => setRuleForm(p => ({ ...p, condition_operator: e.target.value }))}>
                                        <option value="ABOVE">Above ↑</option>
                                        <option value="BELOW">Below ↓</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Value ({tpl?.unit})</label>
                                    <input type="number" step="0.01" placeholder={tpl?.unit === '$' ? '150.00' : '5'}
                                        value={ruleForm.condition_value}
                                        onChange={e => setRuleForm(p => ({ ...p, condition_value: e.target.value }))}
                                        required />
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={ruleForm.priority} onChange={e => setRuleForm(p => ({ ...p, priority: e.target.value }))}>
                                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.emoji} {v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn-submit">Create Rule</button>
                        </form>
                    </div>
                )}

                {/* Rules Tab */}
                {activeTab === 'rules' && (
                    <div className="rules-list">
                        {rules.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">⚙️</div>
                                <h3>No alert rules yet</h3>
                                <p>Create rules to get automatically notified about price movements.</p>
                            </div>
                        ) : rules.map(rule => {
                            const tplCfg = TEMPLATE_CONFIG[rule.template_type];
                            const priCfg = PRIORITY_CONFIG[rule.priority];
                            return (
                                <div key={rule.id} className={`rule-card ${rule.is_active ? '' : 'rule-inactive'}`}>
                                    <div className="rule-left">
                                        <span className="rule-icon">{tplCfg?.icon}</span>
                                        <div>
                                            <div className="rule-symbol">{rule.symbol}</div>
                                            <div className="rule-desc">
                                                {tplCfg?.label}: {rule.condition_operator === 'ABOVE' ? '↑ Above' : '↓ Below'}{' '}
                                                {tplCfg?.unit === '$' ? `$${rule.condition_value}` : `${rule.condition_value}${tplCfg?.unit}`}
                                            </div>
                                            {rule.last_triggered_at && (
                                                <div className="rule-last-triggered">Last triggered: {new Date(rule.last_triggered_at).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rule-right">
                                        <span className="priority-badge" style={{ background: priCfg?.color + '22', color: priCfg?.color, border: `1px solid ${priCfg?.color}44` }}>
                                            {priCfg?.emoji} {priCfg?.label}
                                        </span>
                                        <button className={`toggle-btn ${rule.is_active ? 'active' : ''}`} onClick={() => handleToggleRule(rule)}
                                            title={rule.is_active ? 'Disable' : 'Enable'}>
                                            {rule.is_active ? '✓ Active' : '○ Paused'}
                                        </button>
                                        <button className="btn-delete-rule" onClick={() => handleDeleteRule(rule.id)} title="Delete">🗑</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="history-list">
                        {loading ? (
                            <div className="loading-spinner">Loading alerts...</div>
                        ) : alerts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔕</div>
                                <h3>No alerts yet</h3>
                                <p>Alerts will appear here when triggered by price movements or your custom rules.</p>
                            </div>
                        ) : alerts.map(alert => {
                            const pri = PRIORITY_CONFIG[alert.priority] || PRIORITY_CONFIG.MEDIUM;
                            return (
                                <div key={alert.id} className="alert-history-item" style={{ borderLeftColor: pri.color }}>
                                    <div className="alert-history-content">
                                        <div className="alert-history-symbol">{alert.symbol}</div>
                                        <div className="alert-history-message">{alert.message}</div>
                                        {alert.reason && <div className="alert-history-reason">{alert.reason}</div>}
                                        <div className="alert-history-time">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="alert-history-actions">
                                        <span className="priority-pill" style={{ color: pri.color }}>{pri.emoji}</span>
                                        <button className="btn-dismiss" onClick={() => handleDeleteAlert(alert.id)} title="Dismiss">✕</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default Alerts;
