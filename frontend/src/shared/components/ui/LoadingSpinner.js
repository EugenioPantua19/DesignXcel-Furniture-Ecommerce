import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...',
  overlay = false,
  fullScreen = false,
  className = ''
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `loading-spinner--${size}`,
    overlay ? 'loading-spinner--overlay' : '',
    fullScreen ? 'loading-spinner--fullscreen' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={spinnerClasses}>
      <div className="loading-spinner__container">
        <div className="loading-spinner__spinner" />
        {text && (
          <div className="loading-spinner__text">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
