/**
 * Simple Loading Spinner Component
 * Matches design schema with consistent styling
 */

import React from 'react';

const LoadingSpinner = ({ 
    message = 'Loading...', 
    size = 'medium',
    className = '',
    showMessage = true 
}) => {
    const sizeClasses = {
        small: 'h-5 w-5',
        medium: 'h-8 w-8',
        large: 'h-10 w-10'
    };

    return (
        <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <div 
                className={`animate-spin rounded-full border-3 border-gray-200 border-t-orange-500 border-r-orange-400 ${sizeClasses[size]}`}
                style={{
                    borderColor: '#e5e7eb',
                    borderTopColor: '#F0B21B',
                    borderRightColor: '#f6b221'
                }}
            ></div>
            {showMessage && (
                <p className="mt-4 text-gray-600 text-sm font-inter">{message}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;
