import React from 'react';
import { useNavigate } from 'react-router-dom';

const actions = [
    { label: 'View Portfolio', icon: '◈', path: '/portfolio', accent: 'var(--accent-cyan)' },
    { label: 'Manage Alerts', icon: '◎', path: '/alerts', accent: 'var(--accent-purple)' },
];

const QuickActions = () => {
    const navigate = useNavigate();
    return (
        <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '18px',
            padding: '20px',
        }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
                Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {actions.map(a => (
                    <button
                        key={a.label}
                        onClick={() => navigate(a.path)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            background: 'transparent',
                            border: `1px solid rgba(255,255,255,0.07)`,
                            borderRadius: '12px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            width: '100%',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = `${a.accent}10`;
                            e.currentTarget.style.borderColor = `${a.accent}30`;
                            e.currentTarget.style.color = a.accent;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <span style={{ fontSize: '1rem', color: a.accent }}>{a.icon}</span>
                        {a.label}
                        <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: '0.75rem' }}>→</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
