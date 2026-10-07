
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const APP_LINKS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/markets', label: 'Markets' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/insights', label: 'Insights' },
    { to: '/alerts', label: 'Alerts' },
    { to: '/advisor', label: 'AI Advisor' },
];

const PUBLIC_LINKS = APP_LINKS.filter((l) => l.to !== '/dashboard' && l.to !== '/advisor');

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close the mobile menu whenever the route changes or Escape is pressed
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isMenuOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isMenuOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error('Failed to logout', err);
        }
    };

    const links = user ? APP_LINKS : PUBLIC_LINKS;
    const displayName = user ? (user.name?.split(' ')[0] || user.email?.split('@')[0]) : '';

    return (
        <nav className="nav" aria-label="Main">
            <div className="nav-container">
                <Link to={user ? '/dashboard' : '/'} className="logo">
                    <span className="ldot"></span>Quotra
                </Link>

                <ul id="main-menu" className={`nl ${isMenuOpen ? 'active' : ''}`}>
                    {links.map((l) => (
                        <li key={l.to}>
                            <NavLink to={l.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                                {l.label}
                            </NavLink>
                        </li>
                    ))}
                    {user ? (
                        <>
                            <li className="mobile-only">
                                <NavLink to="/settings">Settings</NavLink>
                            </li>
                            <li className="mobile-only">
                                <button onClick={handleLogout} className="logout-mobile">
                                    Log out
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="mobile-only">
                                <Link to="/login">Log in</Link>
                            </li>
                            <li className="mobile-only">
                                <Link to="/register" style={{ color: 'var(--accent-green)' }}>Join Quotra</Link>
                            </li>
                        </>
                    )}
                </ul>

                <div className="nav-actions">
                    {user ? (
                        <>
                            <NotificationBell />
                            <NavLink to="/settings" className="user-chip desktop-only" title="Account settings">
                                <span className="user-avatar" aria-hidden="true">
                                    {displayName?.charAt(0).toUpperCase()}
                                </span>
                                <span className="user-name">{displayName}</span>
                            </NavLink>
                            <button onClick={handleLogout} className="nav-logout desktop-only">
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-login desktop-only">Log in</Link>
                            <Link to="/register" className="ncta desktop-only">Get started free</Link>
                        </>
                    )}

                    <button
                        className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isMenuOpen}
                        aria-controls="main-menu"
                    >
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
