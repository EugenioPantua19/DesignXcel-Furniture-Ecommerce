import React, { useState } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AudioLoader from '../../../shared/components/ui/AudioLoader';
import apiClient from '../../../shared/services/api/apiClient';
import './DeleteAccountModal.css';

const DeleteAccountModal = ({ isOpen, onClose, user }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1); // 1: OTP, 2: Confirmation
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClose = () => {
        setStep(1);
        setOtpCode('');
        setOtpSent(false);
        setOtpVerified(false);
        setConfirmationText('');
        setError('');
        onClose();
    };

    const handleSendOTP = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await apiClient.post('/api/customer/send-delete-otp');
            if (response.success) {
                setOtpSent(true);
            } else {
                setError(response.message || 'Failed to send OTP');
            }
        } catch (error) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpCode || otpCode.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await apiClient.post('/api/customer/verify-delete-otp', {
                otp: otpCode
            });
            if (response.success) {
                setOtpVerified(true);
                setStep(2);
            } else {
                setError(response.message || 'Invalid OTP');
            }
        } catch (error) {
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirmationText.toLowerCase() !== 'delete') {
            setError('Please type "DELETE" to confirm');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await apiClient.delete('/api/customer/delete-account');
            if (response.success) {
                // Account deleted successfully
                logout();
                navigate('/');
                // Show success message or redirect
            } else {
                setError(response.message || 'Failed to delete account');
            }
        } catch (error) {
            setError('Failed to delete account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="delete-account-overlay" onClick={handleClose}>
            <div className="delete-account-modal" onClick={(e) => e.stopPropagation()}>
                <div className="delete-account-header">
                    <div className="delete-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h2 className="delete-account-title">Delete Account</h2>
                    <p className="delete-account-subtitle">
                        This action cannot be undone. All your data will be permanently deleted.
                    </p>
                </div>
                
                <div className="delete-account-content">
                    {step === 1 && (
                        <div className="otp-step">
                            <div className="step-header">
                                <h3>Step 1: Verify Your Identity</h3>
                                <p>We'll send a verification code to your email address</p>
                            </div>
                            
                            {!otpSent ? (
                                <div className="send-otp-section">
                                    <div className="email-display">
                                        <span className="email-label">Email:</span>
                                        <span className="email-value">{user?.email}</span>
                                    </div>
                                    <button 
                                        className="btn-send-otp"
                                        onClick={handleSendOTP}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <AudioLoader size="small" color="#ffffff" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Verification Code'
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="verify-otp-section">
                                    <div className="otp-input-group">
                                        <label htmlFor="otp-code">Enter 6-digit code:</label>
                                        <input
                                            type="text"
                                            id="otp-code"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            maxLength="6"
                                            className="otp-input"
                                        />
                                    </div>
                                    <button 
                                        className="btn-verify-otp"
                                        onClick={handleVerifyOTP}
                                        disabled={loading || otpCode.length !== 6}
                                    >
                                        {loading ? (
                                            <>
                                                <AudioLoader size="small" color="#ffffff" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify Code'
                                        )}
                                    </button>
                                    <button 
                                        className="btn-resend-otp"
                                        onClick={handleSendOTP}
                                        disabled={loading}
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {step === 2 && (
                        <div className="confirmation-step">
                            <div className="step-header">
                                <h3>Step 2: Confirm Deletion</h3>
                                <p>Type "DELETE" to confirm you want to permanently delete your account</p>
                            </div>
                            
                            <div className="confirmation-input-group">
                                <label htmlFor="confirmation-text">Type "DELETE" to confirm:</label>
                                <input
                                    type="text"
                                    id="confirmation-text"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder="Type DELETE here"
                                    className="confirmation-input"
                                />
                            </div>
                            
                            <div className="warning-section">
                                <div className="warning-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div className="warning-content">
                                    <h4>Warning: This action is irreversible!</h4>
                                    <ul>
                                        <li>All your personal information will be deleted</li>
                                        <li>Your order history will be removed</li>
                                        <li>Your account cannot be recovered</li>
                                        <li>You will need to create a new account to use our services again</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <button 
                                className="btn-delete-account"
                                onClick={handleDeleteAccount}
                                disabled={loading || confirmationText.toLowerCase() !== 'delete'}
                            >
                                {loading ? (
                                    <>
                                        <AudioLoader size="small" color="#ffffff" />
                                        Deleting Account...
                                    </>
                                ) : (
                                    'Delete My Account'
                                )}
                            </button>
                        </div>
                    )}
                    
                    {error && (
                        <div className="error-message">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {error}
                        </div>
                    )}
                </div>
                
                <div className="delete-account-footer">
                    <button className="btn-cancel" onClick={handleClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
