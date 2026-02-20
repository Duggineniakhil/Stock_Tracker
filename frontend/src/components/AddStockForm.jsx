import React from 'react';

const AddStockForm = ({ onAdd }) => {
    const [symbol, setSymbol] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!symbol.trim()) { setError('Enter a symbol'); return; }
        setLoading(true);
        setError('');
        try {
            await onAdd(symbol.toUpperCase());
            setSymbol('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
                <span style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: '12px',
                    pointerEvents: 'none',
                }}>
                    ⌕
                </span>
                <input
                    type="text"
                    placeholder="Search symbol (e.g. AAPL)"
                    value={symbol}
                    onChange={e => setSymbol(e.target.value.toUpperCase())}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '9px 12px 9px 28px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    padding: '8px 14px',
                    background: loading ? 'transparent' : 'rgba(0,229,255,0.1)',
                    border: '1px solid rgba(0,229,255,0.25)',
                    borderRadius: '10px',
                    color: loading ? 'rgba(255,255,255,0.3)' : '#00e5ff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    transition: 'all 0.2s',
                    width: '100%',
                }}
                onMouseEnter={e => { if (!loading) e.target.style.background = 'rgba(0,229,255,0.18)'; }}
                onMouseLeave={e => { if (!loading) e.target.style.background = 'rgba(0,229,255,0.1)'; }}
            >
                {loading ? 'Adding…' : '+ Add to Watchlist'}
            </button>

            {error && (
                <div style={{
                    fontSize: '0.73rem',
                    color: 'var(--market-red, #ff4d6a)',
                    padding: '6px 10px',
                    background: 'rgba(255,77,106,0.08)',
                    border: '1px solid rgba(255,77,106,0.2)',
                    borderRadius: '8px',
                }}>
                    {error}
                </div>
            )}
        </form>
    );
};

export default AddStockForm;
