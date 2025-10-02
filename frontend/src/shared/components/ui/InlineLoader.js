import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const InlineLoader = ({ 
  isLoading, 
  text = 'Loading...', 
  size = 'small',
  children 
}) => {
  if (!isLoading) {
    return children;
  }

  return (
    <LoadingSpinner 
      size={size} 
      text={text} 
      color="#F0B21B"
    />
  );
};

export default InlineLoader;
