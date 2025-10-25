import React from 'react';
import { Audio } from 'react-loader-spinner';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import './AudioLoader.css';

const AudioLoader = ({ 
  size = 'medium', 
  color = '#F0B21B',
  className = '',
  overlay = false,
  fullScreen = false
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return { height: 40, width: 40 };
      case 'large': return { height: 120, width: 120 };
      case 'medium':
      default: return { height: 80, width: 80 };
    }
  };

  const loaderSize = getSize();
  const loaderClasses = [
    'audio-loader',
    `audio-loader--${size}`,
    overlay ? 'audio-loader--overlay' : '',
    fullScreen ? 'audio-loader--fullscreen' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={loaderClasses}>
      <Audio
        height={loaderSize.height}
        width={loaderSize.width}
        color={color}
        ariaLabel="loading"
      />
    </div>
  );
};

export default AudioLoader;
