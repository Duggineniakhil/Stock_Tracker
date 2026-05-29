import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to sign in with Google');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            const msg = err?.response?.data?.error?.message
                || err?.response?.data?.message
                || err?.message
                || 'Failed to create account';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isStrong = hasLength && hasUpper && hasNumber;

    return (
        <div className="auth-page">
            <div className="auth-shell">
                <section className="auth-visual" aria-hidden="true">
                    <Link to="/" className="auth-brand">
                        <span className="ldot"></span>Quotra
                    </Link>

                    <div className="auth-visual-copy">
                        <span className="auth-kicker">Market clarity</span>
                        <h1>Design your investing command center.</h1>
                        <p>Turn watchlists, holdings, and AI market context into a portfolio view that feels alive.</p>
                    </div>

                    <div className="auth-dashboard">
                        <div className="dashboard-glowline"></div>
                        <div className="dash-topline">
                            <span>Live watchlist</span>
                            <strong>+12.8%</strong>
                        </div>
                        <div className="dash-chart">
                            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                        </div>
                        <div className="dash-grid">
                            <div>
                                <span>Assets</span>
                                <strong>18</strong>
                            </div>
                            <div>
                                <span>Alerts</span>
                                <strong>07</strong>
                            </div>
                        </div>
                        <div className="ticker-strip">
                            <span>AAPL +1.42%</span>
                            <span>NVDA +3.08%</span>
                            <span>TSLA -0.64%</span>
                        </div>
                    </div>
                </section>

                <div className="auth-card">
                    <div className="auth-header">
                        <Link to="/" className="logo auth-card-logo">
                            <span className="ldot"></span>Quotra
                        </Link>
                        <h2>Create account</h2>
                        <p>Start tracking your portfolio with sharper daily context.</p>
                    </div>

                    <button
                        type="button"
                        className="google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="auth-divider">Or continue with email</div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="auth-error">{error}</div>}

                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Min. 8 characters"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {password.length > 0 && (
                                <div className="pw-hints">
                                    <span className={hasLength ? 'pw-ok' : 'pw-fail'}>8+ chars</span>
                                    <span className={hasUpper ? 'pw-ok' : 'pw-fail'}>Uppercase</span>
                                    <span className={hasNumber ? 'pw-ok' : 'pw-fail'}>Number</span>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading || !isStrong}>
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
