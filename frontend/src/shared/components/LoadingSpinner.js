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
    const getSpinnerSize = () => {
        switch (size) {
            case 'small': return { height: 20, width: 20 };
            case 'large': return { height: 40, width: 40 };
            case 'medium':
            default: return { height: 32, width: 32 };
        }
    };

    const spinnerSize = getSpinnerSize();

    return (
        <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            {showMessage && (
                <p className="mt-4 text-gray-600 text-sm font-inter">{message}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;
