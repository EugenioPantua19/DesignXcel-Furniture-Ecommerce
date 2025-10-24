import React, { useState, useEffect } from 'react';
import { Bars } from 'react-loader-spinner';
import './TermsModal.css';

const TermsModal = ({ isOpen, onClose, type = 'terms' }) => {
    const [termsData, setTermsData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTermsData();
        }
    }, [isOpen, type]);

    const fetchTermsData = async () => {
        setLoading(true);
        try {
            // Fetch terms from backend API
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiBase}/api/terms`);
            const data = await response.json();
            if (data.success) {
                setTermsData(data.terms);
            }
        } catch (error) {
            console.error('Error fetching terms:', error);
            // Fallback content if API fails
            setTermsData({
                signupTermsTitle: "Terms and Conditions",
                signupTermsContent: "By using our service, you agree to our terms and conditions...",
                privacyPolicyTitle: "Privacy Policy", 
                privacyPolicyContent: "We respect your privacy and are committed to protecting your personal information..."
            });
        } finally {
            setLoading(false);
        }
    };

    const getContent = () => {
        if (!termsData) return null;
        
        if (type === 'terms') {
            return {
                title: termsData.signupTermsTitle || "Terms and Conditions",
                content: termsData.signupTermsContent || "By using our service, you agree to our terms and conditions..."
            };
        } else {
            return {
                title: termsData.privacyPolicyTitle || "Privacy Policy",
                content: termsData.privacyPolicyContent || "We respect your privacy and are committed to protecting your personal information..."
            };
        }
    };

    const content = getContent();

    if (!isOpen) return null;

    return (
        <div className="terms-modal-overlay" onClick={onClose}>
            <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="terms-modal-header">
                    <h2 className="terms-modal-title">
                        {loading ? 'Loading...' : content?.title}
                    </h2>
                    <button className="terms-modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div className="terms-modal-content">
                    {loading ? (
                        <div className="terms-modal-loading">
                            <Bars color="#F0B21B" height={80} width={80} />
                            <p>Loading content...</p>
                        </div>
                    ) : (
                        <div className="terms-modal-text">
                            {content?.content ? (
                                <div dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br/>') }} />
                            ) : (
                                <p>Content not available at the moment.</p>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="terms-modal-footer">
                    <button className="terms-modal-btn terms-modal-btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
