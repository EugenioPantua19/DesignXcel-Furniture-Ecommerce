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
                        <div className="success-icon-large">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#10B981"/>
                                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p className="success-main-text">🎉 You're all set! You can now:</p>
                        <ul className="features-list">
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#F0B21B"/>
                                </svg>
                                <span>Browse our premium furniture collection</span>
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="9" cy="21" r="1" fill="#F0B21B"/>
                                    <circle cx="20" cy="21" r="1" fill="#F0B21B"/>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="#F0B21B" strokeWidth="2" fill="none"/>
                                </svg>
                                <span>Add items to your cart and checkout</span>
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="#F0B21B" strokeWidth="2" fill="none"/>
                                    <line x1="8" y1="21" x2="16" y2="21" stroke="#F0B21B" strokeWidth="2"/>
                                    <line x1="12" y1="17" x2="12" y2="21" stroke="#F0B21B" strokeWidth="2"/>
                                </svg>
                                <span>Track your orders in real-time</span>
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#F0B21B" strokeWidth="2" fill="none"/>
                                </svg>
                                <span>Get support from our team</span>
                            </li>
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
