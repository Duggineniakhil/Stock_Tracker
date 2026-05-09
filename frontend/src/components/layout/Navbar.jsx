import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

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
            <div className="nav-container">
                <Link to="/" className="logo">
                    <span className="ldot"></span>Quotra
                </Link>
                
                <ul className="nl">
                    <li><Link to="/markets">Markets</Link></li>
                    <li><Link to="/portfolio">Portfolio</Link></li>
                    <li><Link to="/advisor">AI Advisor</Link></li>
                    <li><Link to="/insights">Insights</Link></li>
                    <li><Link to="/alerts">Alerts</Link></li>
                </ul>

                <div className="nav-actions">
                    {user ? (
                        <>
                            <NotificationBell />
                            <span className="small-text">
                                Hi, {user.name?.split(' ')[0] || user.email.split('@')[0]}
                            </span>
                            <Link to="/dashboard" className="small-text" style={{ textDecoration: 'underline' }}>Dashboard</Link>
                            <Link to="/settings" className="small-text" style={{ textDecoration: 'underline' }}>Settings</Link>
                            <button onClick={handleLogout} className="ncta">
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/register">
                            <button className="ncta">Get started free</button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
