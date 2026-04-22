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
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            // Extract error from nested Axios error structure
            const msg = err?.response?.data?.error?.message 
                     || err?.response?.data?.message
                     || err?.message 
                     || 'Failed to create account';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Live password strength indicators
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isStrong = hasLength && hasUpper && hasNumber;

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: '1.5rem', fontSize: '24px' }}>
                        <span className="ldot"></span>Quotra
                    </Link>
                    <h2>Create account</h2>
                    <p>Join 50k+ investors today</p>
                </div>
                
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
                                <span className={hasLength ? 'pw-ok' : 'pw-fail'}>✓ 8+ characters</span>
                                <span className={hasUpper ? 'pw-ok' : 'pw-fail'}>✓ Uppercase</span>
                                <span className={hasNumber ? 'pw-ok' : 'pw-fail'}>✓ Number</span>
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
    );
};

export default Register;
