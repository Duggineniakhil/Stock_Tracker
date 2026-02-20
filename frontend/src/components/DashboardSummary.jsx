import React from 'react';

const DashboardSummary = ({ summary, watchlist = [] }) => {
    const fmt = (n, d = 2) => (typeof n === 'number' && !isNaN(n) ? n.toFixed(d) : null);
    const fmtBig = (n) => {
        if (!n || isNaN(n)) return null;
        if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
        if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
        return `$${n.toFixed(2)}`;
    };

    const pnl = summary?.totalPnL ?? null;
    const pnlPct = summary?.totalPnLPercent ?? null;
    const pnlPositive = pnl >= 0;

    // Derive from watchlist if not in summary
    const sorted = [...(watchlist || [])].filter(s => s.changePercent != null && s.currentPrice > 0);
    const top = sorted.sort((a, b) => b.changePercent - a.changePercent)[0];
    const bot = sorted.sort((a, b) => a.changePercent - b.changePercent)[0];

    const cards = [
        {
            label: 'Portfolio Value',
            value: fmtBig(summary?.totalValue) ?? '—',
            sub: summary?.totalInvested ? `Invested: ${fmtBig(summary.totalInvested)}` : null,
            accent: 'var(--accent-cyan)',
            icon: '◈',
        },
        {
            label: 'Total P/L',
            value: pnl != null ? `${pnlPositive ? '+' : ''}$${Math.abs(pnl).toFixed(2)}` : '—',
            sub: pnlPct != null ? `${pnlPositive ? '+' : ''}${pnlPct.toFixed(2)}% all time` : null,
            accent: pnl != null ? (pnlPositive ? 'var(--market-green)' : 'var(--market-red)') : 'var(--text-tertiary)',
            icon: pnlPositive ? '↑' : '↓',
        },
        {
            label: 'Top Gainer',
            value: top ? top.symbol : '—',
            sub: top ? `+${top.changePercent?.toFixed(2)}% today` : null,
            accent: 'var(--market-green)',
            icon: '🚀',
        },
        {
            label: 'Watchlist',
            value: `${watchlist.length}`,
            sub: watchlist.length > 0 ? `${watchlist.length} stock${watchlist.length !== 1 ? 's' : ''} tracked` : null,
            accent: 'var(--accent-purple)',
            icon: '⊞',
        },
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            width: '100%',
            maxWidth: '960px',
            marginBottom: '28px',
        }}>
            {cards.map((card, i) => (
                <div
                    key={card.label}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '18px',
                        padding: '20px 22px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                        animation: `fadeUp 0.5s ${i * 0.08}s both`,
                        cursor: 'default',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = `${card.accent}30`;
                        e.currentTarget.style.boxShadow = `0 8px 32px ${card.accent}15`;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {/* Accent glow top strip */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)`,
                        opacity: 0.6,
                    }} />

                    {/* Icon */}
                    <div style={{
                        fontSize: '1.1rem',
                        marginBottom: '12px',
                        color: card.accent,
                        opacity: 0.9,
                    }}>
                        {card.icon}
                    </div>

                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>
                        {card.label}
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 600, letterSpacing: '-0.5px', color: 'var(--text-primary)', lineHeight: 1 }}>
                        {card.value}
                    </div>
                    {card.sub && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                            {card.sub}
                        </div>
                    )}
                </div>
            ))}

            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }`}</style>
        </div>
    );
};

export default DashboardSummary;
