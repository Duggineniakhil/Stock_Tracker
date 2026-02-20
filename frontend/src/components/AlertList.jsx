import React from 'react';

const AlertList = ({ alerts, loading }) => {
    const getAccent = (type) => {
        switch (type) {
            case 'PRICE_DROP': return { color: 'var(--market-red)', bg: 'var(--market-red-dim)', icon: '↓' };
            case 'MA_CROSSOVER_UP': return { color: 'var(--market-green)', bg: 'var(--market-green-dim)', icon: '↑' };
            case 'MA_CROSSOVER_DOWN': return { color: 'var(--market-yellow)', bg: 'var(--market-yellow-dim)', icon: '~' };
            case 'PERCENTAGE_CHANGE': return { color: 'var(--accent-purple)', bg: 'var(--accent-purple-dim)', icon: '%' };
            case 'TARGET_PRICE': return { color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)', icon: '⊙' };
            default: return { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)', icon: '●' };
        }
    };

    const formatTime = (ts) => {
        const d = new Date(ts);
        const diff = Math.floor((Date.now() - d) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div style={{ padding: '12px 0', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Loading alerts…
            </div>
        );
    }

    if (!alerts || alerts.length === 0) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
            }}>
                No alerts yet.<br />
                <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>Alerts appear when price movements are detected.</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', paddingLeft: '24px' }}>
            {/* Vertical line */}
            <div style={{
                position: 'absolute',
                left: '9px',
                top: '18px',
                bottom: '18px',
                width: '1px',
                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)',
            }} />

            {alerts.map((alert, i) => {
                const accent = getAccent(alert.alertType);
                return (
                    <div
                        key={alert.id}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '14px',
                            padding: '10px 0',
                            position: 'relative',
                            animation: `fadeUp 0.4s ${i * 0.05}s both`,
                        }}
                    >
                        {/* Timeline dot */}
                        <div style={{
                            position: 'absolute',
                            left: '-24px',
                            top: '16px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: accent.bg,
                            border: `1.5px solid ${accent.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            fontWeight: 800,
                            color: accent.color,
                            flexShrink: 0,
                            boxShadow: `0 0 8px ${accent.color}40`,
                        }}>
                            {accent.icon}
                        </div>

                        {/* Card */}
                        <div style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.055)';
                                e.currentTarget.style.borderColor = `${accent.color}30`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5, flex: 1 }}>
                                    {alert.message}
                                </div>
                                <span style={{
                                    fontSize: '0.68rem',
                                    color: 'var(--text-tertiary)',
                                    flexShrink: 0,
                                    paddingTop: '2px',
                                }}>
                                    {formatTime(alert.timestamp || alert.created_at)}
                                </span>
                            </div>
                            <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{
                                    display: 'inline-flex',
                                    padding: '2px 8px',
                                    background: accent.bg,
                                    color: accent.color,
                                    borderRadius: '20px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.3px',
                                }}>
                                    {alert.symbol}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}

            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>
        </div>
    );
};

export default AlertList;
