import React from 'react';

const RecentActivity = ({ alerts = [], loading }) => {
    const formatTime = (ts) => {
        const d = new Date(ts);
        const diff = Math.floor((Date.now() - d) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getAccent = (type) => {
        switch (type) {
            case 'PRICE_DROP': return 'var(--market-red)';
            case 'MA_CROSSOVER_UP': return 'var(--market-green)';
            case 'TARGET_PRICE': return 'var(--accent-cyan)';
            case 'VOLUME_SPIKE': return 'var(--market-yellow)';
            default: return 'var(--accent-purple)';
        }
    };

    const recent = alerts.slice(0, 5);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '18px',
            padding: '20px',
        }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
                Recent Activity
            </div>

            {loading && <div style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>Loading…</div>}

            {!loading && recent.length === 0 && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    No recent alerts.<br />
                    <span style={{ opacity: 0.5, fontSize: '0.72rem' }}>Add alert rules in the Alerts page.</span>
                </div>
            )}

            {!loading && recent.map((a, i) => {
                const accent = getAccent(a.alertType);
                return (
                    <div key={a.id} style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '9px 0',
                        borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        animation: `fadeUp 0.35s ${i * 0.06}s both`,
                    }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: accent,
                            flexShrink: 0,
                            marginTop: '6px',
                            boxShadow: `0 0 6px ${accent}80`,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span style={{ color: accent, fontWeight: 600, marginRight: '4px' }}>{a.symbol}</span>
                                {a.message}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                {formatTime(a.timestamp || a.created_at)}
                            </div>
                        </div>
                    </div>
                );
            })}
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
        </div>
    );
};

export default RecentActivity;
