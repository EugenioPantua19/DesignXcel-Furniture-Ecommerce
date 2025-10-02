import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'default' }) => {
  if (!isOpen) return null;

  // Determine button styling based on type
  const getConfirmButtonClass = () => {
    switch (type) {
      case 'warning':
      case 'danger':
        return 'confirmation-btn confirmation-btn-danger';
      case 'success':
        return 'confirmation-btn confirmation-btn-success';
      default:
        return 'confirmation-btn confirmation-btn-info';
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'danger':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'success':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal">
        <button className="confirmation-modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="confirmation-modal-icon">
          {getIcon()}
        </div>
        
        <div className="confirmation-modal-content">
          <h3 className="confirmation-modal-title">{title || 'Confirm Action'}</h3>
          <p className="confirmation-modal-message">{message || 'Are you sure you want to proceed?'}</p>
        </div>
        
        <div className="confirmation-modal-actions">
          <button 
            onClick={onClose}
            className="confirmation-btn confirmation-btn-cancel"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 