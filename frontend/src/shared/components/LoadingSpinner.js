/**
 * Loading Spinner Component
 * A reusable loading spinner with customizable message
 */

import React from 'react';

const LoadingSpinner = ({ 
    message = 'Loading...', 
    size = 'medium',
    className = '',
    showMessage = true 
}) => {
    const sizeClasses = {
        small: 'h-4 w-4',
        medium: 'h-8 w-8',
        large: 'h-12 w-12'
    };

    return (
        <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
            {showMessage && (
                <p className="mt-4 text-gray-600 text-sm">{message}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;
