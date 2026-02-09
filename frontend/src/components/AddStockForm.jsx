import React, { useState } from 'react';
import './AddStockForm.css';

const AddStockForm = ({ onAdd }) => {
    const [symbol, setSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!symbol.trim()) {
            setError('Please enter a stock symbol');
            return;
        }

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
        <div className="add-stock-form">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="input-group" style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search for stocks (e.g. AAPL)"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        disabled={loading}
                        className="stock-input"
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 36px',
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '24px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="add-btn"
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '24px',
                        color: 'var(--accent-blue)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        alignSelf: 'flex-start', /* Aligns left via flex-start, or center? User said "below". */
                        marginLeft: '4px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(138, 180, 248, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    {loading ? 'Adding...' : '+ Add to Watchlist'}
                </button>

                {error && <div className="error-message" style={{ color: 'var(--market-red)', fontSize: '0.8rem', marginLeft: '8px' }}>{error}</div>}
            </form>
        </div>
    );
};

export default AddStockForm;
