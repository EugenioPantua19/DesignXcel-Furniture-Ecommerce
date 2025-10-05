import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const PageLoader = ({ 
  isLoading, 
  text = 'Loading page...', 
  children 
}) => {
  if (!isLoading) {
    return children;
  }

  return (
    <LoadingSpinner 
      size="large" 
      text={text} 
      fullScreen={true}
    />
  );
};

export default PageLoader;
