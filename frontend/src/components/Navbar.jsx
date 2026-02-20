import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo/Brand */}
                <div className="navbar-brand">
                    <div className="brand-icon">📊</div>
                    <div className="brand-text">
                        <h1>StockFolio</h1>
                        <span>Investment Tracker</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="navbar-links">
                    <Link
                        to="/"
                        className={`nav-link ${isActive('/') ? 'active' : ''}`}
                    >
                        <span className="nav-icon">📈</span>
                        Dashboard
                    </Link>
                    <Link
                        to="/portfolio"
                        className={`nav-link ${isActive('/portfolio') ? 'active' : ''}`}
                    >
                        <span className="nav-icon">💼</span>
                        Portfolio
                    </Link>
                    <Link
                        to="/alerts"
                        className={`nav-link ${isActive('/alerts') ? 'active' : ''}`}
                    >
                        <span className="nav-icon">🔔</span>
                        Alerts
                    </Link>
                </div>

                {/* User Menu */}
                <div className="navbar-user">
                    <div className="user-info">
                        <span className="user-icon">👤</span>
                        <span className="user-email">{user?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
