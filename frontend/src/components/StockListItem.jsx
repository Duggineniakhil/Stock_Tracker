import React from 'react';

const StockListItem = ({ stock, isSelected, onClick, onRemove }) => {
    const isPositive = (stock.change ?? 0) >= 0;
    const hasPrice = stock.currentPrice > 0;

    return (
        <div
            className={`stock-list-item-stem ${isSelected ? 'selected' : ''}`}
            onClick={() => onClick(stock)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                margin: '4px 10px',
                borderRadius: '14px',
                cursor: 'pointer',
                background: isSelected
                    ? 'rgba(0, 229, 255, 0.07)'
                    : 'transparent',
                border: `1px solid ${isSelected ? 'rgba(0, 229, 255, 0.2)' : 'transparent'}`,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={e => {
                if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }
            }}
            onMouseLeave={e => {
                if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                }
            }}
        >
            {/* Symbol bubble */}
            <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                letterSpacing: '0.3px',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.06)',
            }}>
                {stock.symbol.slice(0, 3)}
            </div>

            {/* Name + change */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {stock.symbol}
                </div>
                <div style={{
                    fontSize: '0.72rem',
                    color: hasPrice
                        ? (isPositive ? 'var(--market-green)' : 'var(--market-red)')
                        : 'var(--text-tertiary)',
                    fontWeight: 500,
                    marginTop: '1px',
                }}>
                    {hasPrice
                        ? `${isPositive ? '+' : ''}${stock.changePercent?.toFixed(2)}%`
                        : 'Loading...'}
                </div>
            </div>

            {/* Price */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: hasPrice ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}>
                    {hasPrice ? `$${stock.currentPrice?.toFixed(2)}` : '—'}
                </div>
                {hasPrice && (
                    <div style={{
                        fontSize: '0.68rem',
                        color: isPositive ? 'var(--market-green)' : 'var(--market-red)',
                        marginTop: '1px',
                    }}>
                        {isPositive ? '+' : ''}${stock.change?.toFixed(2)}
                    </div>
                )}
            </div>

            {/* Remove button */}
            <button
                onClick={e => { e.stopPropagation(); onRemove(stock.id); }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '6px',
                    opacity: 0,
                    transition: 'all 0.15s',
                    flexShrink: 0,
                }}
                className="remove-btn"
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,77,106,0.12)';
                    e.currentTarget.style.color = 'var(--market-red)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Show remove on hover via CSS injection */}
            <style>{`
                .stock-list-item-stem:hover .remove-btn { opacity: 1 !important; }
            `}</style>
        </div>
    );
};

export default StockListItem;
