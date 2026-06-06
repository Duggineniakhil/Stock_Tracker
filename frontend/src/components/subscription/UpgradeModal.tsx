
import { useNavigate } from 'react-router-dom';
import './UpgradeModal.css';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName: string;
    requiredPlan?: string;
}

const UpgradeModal = ({ isOpen, onClose, featureName, requiredPlan = 'Student' }: UpgradeModalProps) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="upgrade-modal reveal">
                <button className="close-btn" onClick={onClose}>&times;</button>
                <div className="modal-icon">🔒</div>
                <h2 className="syne">Unlock {featureName}</h2>
                <p className="small-text">
                    This is a premium feature available on our <strong>{requiredPlan}</strong> and <strong>Pro</strong> plans.
                    Upgrade your account to get full access to AI insights, automated reports, and more.
                </p>

                <div className="plan-comparison-mini">
                    <div className="mini-plan">
                        <span className="plan-name">Student</span>
                        <span className="plan-price">$4.99/mo</span>
                    </div>
                    <div className="mini-plan featured">
                        <span className="plan-name">Pro</span>
                        <span className="plan-price">$12.99/mo</span>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary full-width" onClick={() => {
                        onClose();
                        navigate('/pricing');
                    }}>
                        View Pricing Plans
                    </button>
                    <button className="btn btn-secondary full-width" onClick={onClose}>
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
