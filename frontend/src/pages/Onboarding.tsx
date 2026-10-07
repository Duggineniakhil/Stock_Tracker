import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

interface OptionProps {
    label: string;
    selected: boolean;
    onToggle: (label: string) => void;
}

const Option = ({ label, selected, onToggle }: OptionProps) => (
    <button
        type="button"
        className={`option-btn ${selected ? 'selected' : ''}`}
        aria-pressed={selected}
        onClick={() => onToggle(label)}
    >
        {selected ? '✓ ' : ''}{label}
    </button>
);

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();

    const toggle = (option: string) => setSelected(prev => ({ ...prev, [option]: !prev[option] }));

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
                            <Option label="Long-term Growth" selected={!!selected["Long-term Growth"]} onToggle={toggle} />
                            <Option label="Dividend Income" selected={!!selected["Dividend Income"]} onToggle={toggle} />
                            <Option label="Day Trading" selected={!!selected["Day Trading"]} onToggle={toggle} />
                            <Option label="Wealth Preservation" selected={!!selected["Wealth Preservation"]} onToggle={toggle} />
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
                            <Option label="Technology" selected={!!selected["Technology"]} onToggle={toggle} />
                            <Option label="Energy" selected={!!selected["Energy"]} onToggle={toggle} />
                            <Option label="Healthcare" selected={!!selected["Healthcare"]} onToggle={toggle} />
                            <Option label="Crypto" selected={!!selected["Crypto"]} onToggle={toggle} />
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
