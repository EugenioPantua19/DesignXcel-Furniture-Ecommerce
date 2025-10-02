import React, { useState } from 'react';
import apiClient from '../../../shared/services/api/apiClient';
import { LoadingSpinner, InlineLoader } from '../../../shared/components/ui';
import { EyeIcon, EyeOffIcon, LockIcon, CheckCircleIcon } from '../../../shared/components/ui/SvgIcons';

const SecuritySettings = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords({ ...passwords, [name]: value });
    
    // Clear previous messages when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
    }
    
    // Check password strength for new password
    if (name === 'newPassword') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letter');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Number');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Special character');
    
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
    
    return {
      score,
      label: strengthLabels[Math.min(score, 4)],
      color: strengthColors[Math.min(score, 4)],
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : 'Strong password!'
    };
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    // Validation
    if (!passwords.currentPassword) {
      setMessage('Please enter your current password.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!passwords.newPassword) {
      setMessage('Please enter a new password.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('New passwords do not match.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (passwords.newPassword.length < 8) {
      setMessage('New password must be at least 8 characters long.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      setMessage('New password must be different from current password.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to change password...');
      const res = await apiClient.put('/api/customer/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      console.log('Password change response:', res);

      if (res.success) {
        setMessage('Password updated successfully!');
        setMessageType('success');
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordStrength({ score: 0, feedback: '' });
      } else {
        setMessage(res.message || 'Failed to update password.');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setMessage(err.response?.data?.message || 'Failed to update password. Please check your current password.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-settings">
      <div className="section-header">
        <div>
          <h2 className="section-title">Password Manager</h2>
          <p className="section-subtitle">Change your password to keep your account secure</p>
        </div>
      </div>

      {message && (
        <div className={`message ${messageType === 'success' ? 'success' : 'error'}`} style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: `1px solid ${messageType === 'success' ? '#22c55e' : '#ef4444'}`,
          backgroundColor: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
          color: messageType === 'success' ? '#166534' : '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {messageType === 'success' ? (
            <CheckCircleIcon size={20} color="#22c55e" />
          ) : (
            <LockIcon size={20} color="#ef4444" />
          )}
          {message}
        </div>
      )}

      <form className="password-form" onSubmit={handlePasswordUpdate}>
        <div className="form-group">
          <label className="form-label">Current Password *</label>
          <div className="password-input-wrapper" style={{ position: 'relative' }}>
            <input
              type={showPasswords.current ? "text" : "password"}
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className="form-input"
              placeholder="Enter your current password"
              required
              style={{
                width: '100%',
                padding: '12px 48px 12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s ease'
              }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              {showPasswords.current ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">New Password *</label>
          <div className="password-input-wrapper" style={{ position: 'relative' }}>
            <input
              type={showPasswords.new ? "text" : "password"}
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              className="form-input"
              placeholder="Enter your new password"
              required
              style={{
                width: '100%',
                padding: '12px 48px 12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s ease'
              }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              {showPasswords.new ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {passwords.newPassword && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Password Strength:</span>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  color: passwordStrength.color || '#6b7280'
                }}>
                  {passwordStrength.label || 'Very Weak'}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(passwordStrength.score / 5) * 100}%`,
                  height: '100%',
                  backgroundColor: passwordStrength.color || '#ef4444',
                  transition: 'all 0.3s ease'
                }} />
              </div>
              {passwordStrength.feedback && (
                <div style={{ 
                  fontSize: '11px', 
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  {passwordStrength.feedback}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password *</label>
          <div className="password-input-wrapper" style={{ position: 'relative' }}>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              className="form-input"
              placeholder="Confirm your new password"
              required
              style={{
                width: '100%',
                padding: '12px 48px 12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s ease'
              }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              {showPasswords.confirm ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
            </button>
          </div>
          
          {/* Password Match Indicator */}
          {passwords.confirmPassword && (
            <div style={{ marginTop: '8px' }}>
              {passwords.newPassword === passwords.confirmPassword ? (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CheckCircleIcon size={16} color="#22c55e" />
                  Passwords match
                </div>
              ) : (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#ef4444'
                }}>
                  Passwords do not match
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-actions" style={{ marginTop: '24px' }}>
          <InlineLoader 
            isLoading={loading} 
            text="Updating password..."
            size="small"
          >
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#F0B21B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              Update Password
            </button>
          </InlineLoader>
        </div>
      </form>
    </div>
  );
};

export default SecuritySettings;