import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error('Failed to logout', err);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <header className={`nav-container ${scrolled ? 'scrolled' : ''}`}>
            <div className="container nav-content">
                <Link to="/" className="nav-logo">
                    <span className="ldot"></span>Quotra
                </Link>
                
                <nav>
                    <ul className="nav-links">
                        <li>
                            <Link to="/markets" className={`nav-link ${isActive('/markets') ? 'active' : ''}`}>
                                Markets
                            </Link>
                        </li>
                        <li>
                            <Link to="/portfolio" className={`nav-link ${isActive('/portfolio') ? 'active' : ''}`}>
                                Portfolio
                            </Link>
                        </li>
                        <li>
                            <Link to="/insights" className={`nav-link ${isActive('/insights') ? 'active' : ''}`}>
                                Insights
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="nav-actions">
                    {user ? (
                        <>
                            <div className="user-info">
                                <span className="dm-sans">
                                    {user.name?.split(' ')[0] || user.email.split('@')[0]}
                                </span>
                                <Link to="/dashboard" className="user-avatar">
                                    {(user.name?.[0] || user.email[0]).toUpperCase()}
                                </Link>
                            </div>
                            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1.2rem', fontSize: '12px' }}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link" style={{ fontSize: '13px' }}>Sign in</Link>
                            <Link to="/register">
                                <button className="btn btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
                                    Get started
                                </button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
