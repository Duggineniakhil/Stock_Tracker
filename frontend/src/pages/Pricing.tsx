import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePlan } from '../services/api';
import './Pricing.css';

const Pricing = () => {
    const { user, updateUserPlan } = useAuth();
    const [loading, setLoading] = useState(false);

    const plans = [
        {
            name: 'Free',
            price: '$0',
            slug: 'free',
            features: [
                '5 portfolio holdings',
                '3 active alerts',
                'Real-time price tracking',
                'Basic analytics',
                'Standard support'
            ],
            buttonText: 'Current Plan',
            current: user?.plan === 'free' || !user?.plan,
            featured: false
        },
        {
            name: 'Student',
            price: '$4.99',
            slug: 'student',
            period: '/mo',
            features: [
                '20 portfolio holdings',
                '10 active alerts',
                'AI Advisor (50 msgs/mo)',
                'News sentiment analysis',
                'Priority email support'
            ],
            buttonText: 'Upgrade to Student',
            current: user?.plan === 'student',
            featured: false,
            badge: '🎓 Most Popular'
        },
        {
            name: 'Pro',
            price: '$12.99',
            slug: 'pro',
            period: '/mo',
            features: [
                'Unlimited holdings',
                'Unlimited alerts',
                'Full AI Advisor access',
                'Custom health reports',
                '24/7 Priority support'
            ],
            buttonText: 'Upgrade to Pro',
            current: user?.plan === 'pro',
            featured: true,
            badge: '⚡ Maximum Power'
        }
    ];

    const handleUpgrade = async (planSlug: string, planName: string) => {
        if (!user) {
            alert('Please login to upgrade your plan');
            return;
        }

        const confirm = window.confirm(`Confirm upgrade to ${planName}? This is a mock payment simulation.`);
        if (!confirm) return;

        setLoading(true);
        try {
            // Mocking a 1.5s payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            await updatePlan(user.email, planSlug);
            updateUserPlan(planSlug);
            
            alert(`Successfully upgraded to ${planName}!`);
        } catch (err) {
            console.error('Upgrade failed:', err);
            alert('Failed to update plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pricing-page">
            <header className="pricing-header reveal">
                <div className="hbadge"><span className="ldot"></span> Transparent Pricing</div>
                <h1 className="syne">Choose your plan.</h1>
                <p className="small-text">Flexible options for every type of investor.</p>
            </header>

            <div className="plans-grid">
                {plans.map((plan, idx) => (
                    <div key={idx} className={`plan-card ${plan.featured ? 'featured' : ''} ${plan.current ? 'current' : ''} reveal`}>
                        {plan.badge && <div className="plan-badge">{plan.badge}</div>}
                        <div className="plan-header">
                            <h3 className="syne">{plan.name}</h3>
                            <div className="plan-price-box">
                                <span className="price-val">{plan.price}</span>
                                {plan.period && <span className="price-period">{plan.period}</span>}
                            </div>
                        </div>

                        <ul className="plan-features">
                            {plan.features.map((feature, fIdx) => (
                                <li key={fIdx}>
                                    <span className="check">✓</span> {feature}
                                </li>
                            ))}
                        </ul>

                        <button 
                            className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'} full-width`}
                            disabled={plan.current || loading}
                            onClick={() => handleUpgrade(plan.slug, plan.name)}
                        >
                            {loading ? 'Processing...' : (plan.current ? 'Your Current Plan' : plan.buttonText)}
                        </button>
                    </div>
                ))}
            </div>

            <footer className="pricing-footer reveal">
                <p className="small-text muted">All plans include standard Quotra security and privacy features.</p>
            </footer>
        </div>
    );
};

export default Pricing;
