import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
    const location = useLocation();
    const successMsg = location.state?.message;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: '1.5rem', fontSize: '24px' }}>
                        <span className="ldot"></span>Quotra
                    </Link>
                    <h2 className="syne">Welcome back</h2>
                    <p>Enter your details to access your dashboard</p>
                </div>
                
                <form className="auth-form" onSubmit={handleSubmit}>
                    {successMsg && <div className="auth-success" style={{ padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', backgroundColor: 'rgba(0, 232, 135, 0.1)', color: '#00e887', fontSize: '14px', textAlign: 'center', border: '1px solid rgba(0, 232, 135, 0.2)' }}>{successMsg}</div>}
                    {error && <div className="auth-error">{error}</div>}
                    
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
                            placeholder="••••••••" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button type="submit" className="bp auth-submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
