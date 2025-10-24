import React from 'react';
import './SignupSuccessModal.css';

const SignupSuccessModal = ({ isOpen, onClose, userData }) => {
    if (!isOpen) return null;

    const handleContinue = () => {
        onClose();
        // The parent component will handle navigation
    };

    return (
        <div className="signup-success-overlay" onClick={onClose}>
            <div className="signup-success-modal" onClick={(e) => e.stopPropagation()}>
                <div className="signup-success-header">
                    <div className="success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#10B981"/>
                            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h2 className="signup-success-title">Welcome to Design Excellence!</h2>
                    <p className="signup-success-subtitle">
                        Your account has been created successfully
                    </p>
                </div>
                
                <div className="signup-success-content">
                    <div className="user-info">
                        <div className="user-avatar">
                            <span className="avatar-text">
                                {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
                            </span>
                        </div>
                        <div className="user-details">
                            <h3 className="user-name">{userData?.fullName || 'User'}</h3>
                            <p className="user-email">{userData?.email || 'user@example.com'}</p>
                        </div>
                    </div>
                    
                    <div className="success-message">
                        <p>🎉 You're all set! You can now:</p>
                        <ul className="features-list">
                            <li>✨ Browse our premium furniture collection</li>
                            <li>🛒 Add items to your cart and checkout</li>
                            <li>📱 Track your orders in real-time</li>
                            <li>💬 Get support from our team</li>
                        </ul>
                    </div>
                </div>
                
                <div className="signup-success-footer">
                    <button className="success-btn success-btn-primary" onClick={handleContinue}>
                        Start Shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignupSuccessModal;
