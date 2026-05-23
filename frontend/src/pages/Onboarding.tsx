import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    const nextStep = () => setStep(step + 1);
    const finish = () => navigate('/dashboard');

    return (
        <div className="onboarding-page">
            <div className="onboarding-card reveal">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                {step === 1 && (
                    <div className="step-content">
                        <div className="step-icon">👋</div>
                        <h1 className="syne">Welcome to Quotra.</h1>
                        <p>Let's personalize your investing experience. First, what are your primary investing goals?</p>
                        <div className="options-grid">
                            <button className="option-btn">Long-term Growth</button>
                            <button className="option-btn">Dividend Income</button>
                            <button className="option-btn">Day Trading</button>
                            <button className="option-btn">Wealth Preservation</button>
                        </div>
                        <button className="btn btn-primary full-width" onClick={nextStep}>Next Step</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <div className="step-icon">📈</div>
                        <h1 className="syne">Market Interests.</h1>
                        <p>Which sectors do you want to track most closely?</p>
                        <div className="options-grid">
                            <button className="option-btn">Technology</button>
                            <button className="option-btn">Energy</button>
                            <button className="option-btn">Healthcare</button>
                            <button className="option-btn">Crypto</button>
                        </div>
                        <button className="btn btn-primary full-width" onClick={nextStep}>Continue</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <div className="step-icon">✨</div>
                        <h1 className="syne">You're all set!</h1>
                        <p>Your dashboard is ready. We've enabled basic AI insights for your account. You can upgrade anytime to unlock full power.</p>
                        <div className="summary-box">
                            <div className="small-text">Estimated Daily Analysis: <strong>Enabled</strong></div>
                            <div className="small-text">Alert Threshold: <strong>5% Move</strong></div>
                        </div>
                        <button className="btn btn-primary full-width" onClick={finish}>Go to Dashboard</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
