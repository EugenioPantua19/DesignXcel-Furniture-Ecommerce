import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#F0B21B', 
  text = 'Loading...',
  overlay = false,
  fullScreen = false 
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `loading-spinner--${size}`,
    overlay ? 'loading-spinner--overlay' : '',
    fullScreen ? 'loading-spinner--fullscreen' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={spinnerClasses}>
      <div className="loading-spinner__container">
        <div 
          className="loading-spinner__spinner" 
          style={{ borderColor: `${color} transparent transparent transparent` }}
        />
        {text && (
          <div className="loading-spinner__text" style={{ color }}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
