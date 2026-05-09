import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <div className="nav-container">
                <Link to="/" className="logo">
                    <span className="ldot"></span>Quotra
                </Link>
                
                <ul className={`nl ${isMenuOpen ? 'active' : ''}`}>
                    <li><Link to="/markets" onClick={() => setIsMenuOpen(false)}>Markets</Link></li>
                    <li><Link to="/portfolio" onClick={() => setIsMenuOpen(false)}>Portfolio</Link></li>
                    <li><Link to="/insights" onClick={() => setIsMenuOpen(false)}>Insights</Link></li>
                    <li><Link to="/alerts" onClick={() => setIsMenuOpen(false)}>Alerts</Link></li>
                    {user && (
                        <>
                            <li className="mobile-only">
                                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                            </li>
                            <li className="mobile-only">
                                <Link to="/settings" onClick={() => setIsMenuOpen(false)}>Settings</Link>
                            </li>
                            <li className="mobile-only">
                                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="logout-mobile">
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="mobile-only">
                                <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                            </li>
                            <li className="mobile-only">
                                <Link to="/register" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--accent-green)' }}>Join Quotra</Link>
                            </li>
                        </>
                    )}
                </ul>

                <div className="nav-actions">
                    {user ? (
                        <>
                            <NotificationBell />
                            <div className="user-meta desktop-only">
                                <span className="small-text">
                                    Hi, {user.name?.split(' ')[0] || user.email.split('@')[0]}
                                </span>
                                <Link to="/dashboard" className="small-text" style={{ textDecoration: 'underline' }}>Dashboard</Link>
                            </div>
                            <button onClick={handleLogout} className="ncta desktop-only">
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/register" className="desktop-only">
                            <button className="ncta">Get started free</button>
                        </Link>
                    )}
                    
                    <button className={`menu-toggle ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
