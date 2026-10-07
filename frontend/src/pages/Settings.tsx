import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/api';
import './Settings.css';

type FormMessage = { type: 'success' | 'error'; text: string } | null;

const getApiErrorMessage = (err: any, fallback: string) =>
    err?.response?.data?.message || err?.response?.data?.error?.message || fallback;

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState<FormMessage>(null);
    const [passwordMessage, setPasswordMessage] = useState<FormMessage>(null);

    const profileUnchanged = profileData.name.trim() === (user?.name || '') && profileData.email.trim().toLowerCase() === (user?.email || '');

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileMessage(null);
        try {
            const res = await updateProfile({ name: profileData.name.trim(), email: profileData.email.trim() });
            const updated = res?.data || {};
            updateUser({ name: updated.name ?? profileData.name.trim(), email: updated.email ?? profileData.email.trim().toLowerCase() }, updated.token);
            setProfileMessage({ type: 'success', text: 'Profile updated.' });
        } catch (err: any) {
            setProfileMessage({ type: 'error', text: getApiErrorMessage(err, 'Couldn\'t update your profile. Please try again.') });
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);
        if (passData.newPassword !== passData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setPasswordSaving(true);
        try {
            await changePassword({ currentPassword: passData.currentPassword, newPassword: passData.newPassword });
            setPasswordMessage({ type: 'success', text: 'Password changed.' });
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: getApiErrorMessage(err, 'Couldn\'t change your password. Please try again.') });
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <div className="settings-page">
            <header className="reveal">
                <div className="hbadge"><span className="ldot"></span> Account Control</div>
                <h1 className="h1">User<br /><span className="g-text">Settings.</span></h1>
            </header>

            <div className="settings-grid">
                <div className="card reveal">
                    <h3 className="syne">Profile Information</h3>
                    <form onSubmit={handleProfileUpdate} className="settings-form">
                        <div className="input-group">
                            <label htmlFor="settings-name">Full Name</label>
                            <input
                                id="settings-name"
                                type="text"
                                autoComplete="name"
                                value={profileData.name}
                                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="settings-email">Email Address</label>
                            <input
                                id="settings-email"
                                type="email"
                                autoComplete="email"
                                value={profileData.email}
                                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                required
                            />
                        </div>
                        {profileMessage && <div className={`alert-banner ${profileMessage.type}`} role="status">{profileMessage.text}</div>}
                        <button type="submit" className="btn btn-primary" disabled={profileSaving || profileUnchanged}>
                            {profileSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>

                <div className="card reveal">
                    <h3 className="syne">Security</h3>
                    <form onSubmit={handlePasswordChange} className="settings-form">
                        <div className="input-group">
                            <label htmlFor="settings-current-password">Current Password</label>
                            <input
                                id="settings-current-password"
                                type="password"
                                autoComplete="current-password"
                                value={passData.currentPassword}
                                onChange={e => setPassData({ ...passData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="settings-new-password">New Password</label>
                            <input
                                id="settings-new-password"
                                type="password"
                                autoComplete="new-password"
                                minLength={8}
                                aria-describedby="settings-password-hint"
                                value={passData.newPassword}
                                onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                                required
                            />
                            <span id="settings-password-hint" className="input-hint">At least 8 characters, with one uppercase letter and one number.</span>
                        </div>
                        <div className="input-group">
                            <label htmlFor="settings-confirm-password">Confirm New Password</label>
                            <input
                                id="settings-confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={passData.confirmPassword}
                                onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        {passwordMessage && <div className={`alert-banner ${passwordMessage.type}`} role="status">{passwordMessage.text}</div>}
                        <button type="submit" className="btn btn-secondary" disabled={passwordSaving}>
                            {passwordSaving ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>

                <div className="card reveal subscription-status">
                    <h3 className="syne">Subscription</h3>
                    <div className="plan-details">
                        <div className="current-plan-label">Current Plan: <span className="g-text">{user?.plan?.toUpperCase() || 'FREE'}</span></div>
                        <p className="small-text muted">Compare plans and upgrade to unlock more features.</p>
                        <Link to="/pricing" className="btn btn-outline">
                            View Plans
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
