/**
 * Unauthorized Page Component
 * Displays when user lacks sufficient permissions to access a page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const UnauthorizedPage = ({
    title = 'Access Denied',
    message = 'You do not have permission to access this page.',
    requiredRole = null,
    requiredRoles = [],
    userRole = null,
    requiredPermission = null,
    requiredPermissions = [],
    requireAllPermissions = false,
    section = null,
    action = null,
    showContactSupport = false,
    showBackButton = true,
    customActions = null
}) => {
    const navigate = useNavigate();
    const { isCustomer, isEmployee, logout } = useAuth();

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        if (isCustomer) {
            navigate('/');
        } else if (isEmployee) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleContactSupport = () => {
        if (isCustomer) {
            navigate('/support');
        } else {
            window.location.href = 'mailto:support@designxcel.com';
        }
    };

    const handleLogout = () => {
        logout();
    };

    const renderRequirementDetails = () => {
        const details = [];

        if (requiredRole) {
            details.push(`Required Role: ${requiredRole}`);
        }

        if (requiredRoles.length > 0) {
            details.push(`Required Roles: ${requiredRoles.join(', ')}`);
        }

        if (userRole) {
            details.push(`Your Role: ${userRole}`);
        }

        if (requiredPermission) {
            details.push(`Required Permission: ${requiredPermission}`);
        }

        if (requiredPermissions.length > 0) {
            const permText = requireAllPermissions ? 'All Required Permissions' : 'Required Permissions (any)';
            details.push(`${permText}: ${requiredPermissions.join(', ')}`);
        }

        if (section && action) {
            details.push(`Required Access: ${action} access to ${section}`);
        }

        return details;
    };

    const requirementDetails = renderRequirementDetails();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Lock Icon */}
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-6">
                        <svg 
                            className="h-6 w-6 text-red-600" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {title}
                        </h1>
                        
                        {/* Main Message */}
                        <p className="text-gray-600 mb-6">
                            {message}
                        </p>

                        {/* Requirement Details */}
                        {requirementDetails.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">
                                    Access Requirements:
                                </h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {requirementDetails.map((detail, index) => (
                                        <li key={index} className="flex items-center">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Custom Actions */}
                        {customActions && (
                            <div className="mb-6">
                                {customActions}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {showBackButton && (
                                <button
                                    onClick={handleGoBack}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Go Back
                                </button>
                            )}

                            <button
                                onClick={handleGoHome}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isCustomer ? 'Go to Homepage' : isEmployee ? 'Go to Dashboard' : 'Go to Login'}
                            </button>

                            {showContactSupport && (
                                <button
                                    onClick={handleContactSupport}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Contact Support
                                </button>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500">
                                If you believe you should have access to this page, please contact your administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
