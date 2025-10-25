/**
 * Protected Route Component
 * Handles route protection based on authentication status and roles
 * Simplified version without permission system
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UnauthorizedPage from './UnauthorizedPage';

/**
 * ProtectedRoute Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string} props.requiredRole - Specific role required for access
 * @param {Array<string>} props.requiredRoles - Array of roles (user needs any one)
 * @param {string} props.redirectTo - Custom redirect path (default: '/login')
 * @param {boolean} props.showUnauthorized - Show unauthorized page instead of redirecting (default: false)
 * @param {React.ReactNode} props.fallback - Custom fallback component for unauthorized access
 * @param {function} props.customCheck - Custom authorization check function
 */
const ProtectedRoute = ({
    children,
    requiredRole = null,
    requiredRoles = [],
    redirectTo = '/login',
    showUnauthorized = false,
    fallback = null,
    customCheck = null
}) => {
    const { 
        isAuthenticated, 
        loading, 
        user, 
        isCustomer, 
        isEmployee,
        isAdmin
    } = useAuth();
    
    const location = useLocation();

    // Show loading message while authentication is being checked
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                padding: '20px',
                fontSize: window.innerWidth < 768 ? '14px' : '16px',
                color: '#6b7280',
                gap: window.innerWidth < 768 ? '12px' : '16px',
                textAlign: 'center'
            }}>
                <div style={{
                    fontWeight: '500',
                    maxWidth: '280px',
                    lineHeight: '1.5'
                }}>
                    Checking access permissions...
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return (
            <Navigate 
                to={redirectTo} 
                state={{ from: location, message: 'Please log in to access this page.' }} 
                replace 
            />
        );
    }

    // Custom authorization check
    if (customCheck && typeof customCheck === 'function') {
        const hasAccess = customCheck(user);
        if (!hasAccess) {
            if (showUnauthorized) {
                return <UnauthorizedPage />;
            }
            if (fallback) {
                return fallback;
            }
            return (
                <Navigate 
                    to={redirectTo} 
                    state={{ from: location, message: 'You do not have permission to access this page.' }} 
                    replace 
                />
            );
        }
    }

    // Role-based authorization
    if (requiredRole || requiredRoles.length > 0) {
        const userRole = user?.role;
        let hasRequiredRole = false;

        if (requiredRole) {
            hasRequiredRole = userRole === requiredRole;
        } else if (requiredRoles.length > 0) {
            hasRequiredRole = requiredRoles.includes(userRole);
        }

        if (!hasRequiredRole) {
            if (showUnauthorized) {
                return <UnauthorizedPage />;
            }
            if (fallback) {
                return fallback;
            }
            return (
                <Navigate 
                    to={redirectTo} 
                    state={{ from: location, message: 'You do not have the required role to access this page.' }} 
                    replace 
                />
            );
        }
    }

    // If all checks pass, render children
    return children;
};

/**
 * Hook for conditional rendering based on authentication and roles
 */
export const useConditionalRender = () => {
    const { isAuthenticated, user, isCustomer, isEmployee, isAdmin } = useAuth();

    /**
     * Check if user has a specific role
     */
    const hasRole = (role) => {
        return user?.role === role;
    };

    /**
     * Check if user has any of the specified roles
     */
    const hasAnyRole = (roles) => {
        return roles.includes(user?.role);
    };

    /**
     * Check if user is admin
     */
    const isUserAdmin = () => {
        return isAdmin;
    };

    /**
     * Check if user is employee
     */
    const isUserEmployee = () => {
        return isEmployee;
    };

    /**
     * Check if user is customer
     */
    const isUserCustomer = () => {
        return isCustomer;
    };

    return {
        isAuthenticated,
        user,
        hasRole,
        hasAnyRole,
        isUserAdmin,
        isUserEmployee,
        isUserCustomer
    };
};

export default ProtectedRoute;