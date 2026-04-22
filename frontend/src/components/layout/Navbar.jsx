import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error('Failed to logout', err);
        }
    };

    return (
        <nav className="nav">
            <Link to="/" className="logo">
                <span className="ldot"></span>Quotra
            </Link>
            
            <ul className="nl">
                <li><Link to="/markets">Markets</Link></li>
                <li><Link to="/portfolio">Portfolio</Link></li>
                <li><Link to="/insights">Insights</Link></li>
            </ul>

            <div className="nav-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {user ? (
                    <>
                        <Link to="/dashboard" className="muted" style={{ fontSize: '13px' }}>Dashboard</Link>
                        <button onClick={handleLogout} className="ncta" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/register">
                        <button className="ncta">Get started free</button>
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
