import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/api';
import './Settings.css';

const Settings = () => {
    const { user, login } = useAuth();
    const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(profileData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        setLoading(true);
        try {
            await changePassword({ currentPassword: passData.currentPassword, newPassword: passData.newPassword });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Password change failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page">
            <header className="reveal">
                <div className="hbadge"><span className="ldot"></span> Account Control</div>
                <h1 className="h1">User<br /><span className="g-text">Settings.</span></h1>
            </header>

            {message.text && (
                <div className={`alert-banner ${message.type} reveal`}>
                    {message.text}
                </div>
            )}

            <div className="settings-grid">
                <div className="card reveal">
                    <h3 className="syne">Profile Information</h3>
                    <form onSubmit={handleProfileUpdate} className="settings-form">
                        <div className="input-group">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                value={profileData.name} 
                                onChange={e => setProfileData({...profileData, name: e.target.value})} 
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                value={profileData.email} 
                                onChange={e => setProfileData({...profileData, email: e.target.value})} 
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Update Profile'}
                        </button>
                    </form>
                </div>

                <div className="card reveal">
                    <h3 className="syne">Security</h3>
                    <form onSubmit={handlePasswordChange} className="settings-form">
                        <div className="input-group">
                            <label>Current Password</label>
                            <input 
                                type="password" 
                                value={passData.currentPassword} 
                                onChange={e => setPassData({...passData, currentPassword: e.target.value})} 
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>New Password</label>
                            <input 
                                type="password" 
                                value={passData.newPassword} 
                                onChange={e => setPassData({...passData, newPassword: e.target.value})} 
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Confirm New Password</label>
                            <input 
                                type="password" 
                                value={passData.confirmPassword} 
                                onChange={e => setPassData({...passData, confirmPassword: e.target.value})} 
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary" disabled={loading}>
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>

                <div className="card reveal subscription-status">
                    <h3 className="syne">Subscription</h3>
                    <div className="plan-details">
                        <div className="current-plan-label">Current Plan: <span className="g-text">{user?.plan?.toUpperCase() || 'FREE'}</span></div>
                        <p className="small-text muted">Manage your subscription and billing details.</p>
                        <button className="btn btn-outline" onClick={() => window.location.href='/pricing'}>
                            View Plans
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
