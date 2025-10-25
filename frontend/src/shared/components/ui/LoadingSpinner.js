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

  const getSpinnerSize = () => {
    switch (size) {
      case 'small': return { height: 20, width: 20 };
      case 'large': return { height: 80, width: 80 };
      case 'medium':
      default: return { height: 40, width: 40 };
    }
  };

  const spinnerSize = getSpinnerSize();

  return (
    <div className={spinnerClasses}>
      <div className="loading-spinner__container">
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
