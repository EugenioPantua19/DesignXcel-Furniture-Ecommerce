/**
 * Protected Route Component
 * Handles route protection based on authentication status, roles, and permissions
 * Provides comprehensive access control for React Router
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from './LoadingSpinner';
import UnauthorizedPage from './UnauthorizedPage';

/**
 * ProtectedRoute Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string} props.requiredRole - Specific role required for access
 * @param {Array<string>} props.requiredRoles - Array of roles (user needs any one)
 * @param {string} props.requiredPermission - Single permission required
 * @param {Array<string>} props.requiredPermissions - Array of permissions
 * @param {boolean} props.requireAllPermissions - Whether all permissions are required (default: false)
 * @param {string} props.section - Section for permission checking
 * @param {string} props.action - Action for section permission checking (default: 'view')
 * @param {string} props.redirectTo - Custom redirect path (default: '/login')
 * @param {boolean} props.showUnauthorized - Show unauthorized page instead of redirecting (default: false)
 * @param {React.ReactNode} props.fallback - Custom fallback component for unauthorized access
 * @param {function} props.customCheck - Custom authorization check function
 */
const ProtectedRoute = ({
    children,
    requiredRole = null,
    requiredRoles = [],
    requiredPermission = null,
    requiredPermissions = [],
    requireAllPermissions = false,
    section = null,
    action = 'view',
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
        isEmployee 
    } = useAuth();
    
    const {
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        hasSectionPermission,
        isAdmin
    } = usePermissions();
    
    const location = useLocation();

    // Show loading spinner while authentication is being checked
    if (loading) {
        return <LoadingSpinner message="Checking access permissions..." />;
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

    // Check if user account is active (for customers)
    if (isCustomer && user && user.isActive === false) {
        if (showUnauthorized) {
            return fallback || (
                <UnauthorizedPage 
                    title="Account Deactivated"
                    message="Your account has been deactivated. Please contact customer support for assistance."
                    showContactSupport={true}
                />
            );
        }
        
        return (
            <Navigate 
                to="/account-deactivated" 
                state={{ from: location }} 
                replace 
            />
        );
    }

    // Custom authorization check
    if (customCheck && typeof customCheck === 'function') {
        const customResult = customCheck(user);
        if (!customResult) {
            if (showUnauthorized) {
                return fallback || (
                    <UnauthorizedPage 
                        title="Access Denied"
                        message="You do not have permission to access this page."
                    />
                );
            }
            
            return (
                <Navigate 
                    to="/unauthorized" 
                    state={{ from: location }} 
                    replace 
                />
            );
        }
    }

    // Check specific role requirement
    if (requiredRole) {
        if (!hasRole(requiredRole)) {
            if (showUnauthorized) {
                return fallback || (
                    <UnauthorizedPage 
                        title="Insufficient Privileges"
                        message={`This page requires ${requiredRole} role access.`}
                        requiredRole={requiredRole}
                        userRole={user?.role}
                    />
                );
            }
            
            return (
                <Navigate 
                    to="/unauthorized" 
                    state={{ 
                        from: location, 
                        message: `Access denied. ${requiredRole} role required.` 
                    }} 
                    replace 
                />
            );
        }
    }

    // Check multiple roles requirement (user needs any one)
    if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => hasRole(role));
        
        if (!hasRequiredRole) {
            if (showUnauthorized) {
                return fallback || (
                    <UnauthorizedPage 
                        title="Insufficient Privileges"
                        message={`This page requires one of the following roles: ${requiredRoles.join(', ')}`}
                        requiredRoles={requiredRoles}
                        userRole={user?.role}
                    />
                );
            }
            
            return (
                <Navigate 
                    to="/unauthorized" 
                    state={{ 
                        from: location, 
                        message: `Access denied. Required roles: ${requiredRoles.join(', ')}` 
                    }} 
                    replace 
                />
            );
        }
    }

    // Check single permission requirement
    if (requiredPermission) {
        if (!hasAnyPermission([requiredPermission])) {
            if (showUnauthorized) {
                return fallback || (
                    <UnauthorizedPage 
                        title="Insufficient Permissions"
                        message={`This page requires '${requiredPermission}' permission.`}
                        requiredPermission={requiredPermission}
                    />
                );
            }
            
            return (
                <Navigate 
                    to="/unauthorized" 
                    state={{ 
                        from: location, 
                        message: `Access denied. Required permission: ${requiredPermission}` 
                    }} 
                    replace 
                />
            );
        }
    }

    // Check multiple permissions requirement
    if (requiredPermissions.length > 0) {
        const hasAccess = requireAllPermissions 
            ? hasAllPermissions(requiredPermissions)
            : hasAnyPermission(requiredPermissions);
        
        if (!hasAccess) {
            const permissionMessage = requireAllPermissions
                ? `This page requires all of the following permissions: ${requiredPermissions.join(', ')}`
                : `This page requires one of the following permissions: ${requiredPermissions.join(', ')}`;
            
            if (showUnauthorized) {
                return fallback || (
                    <UnauthorizedPage 
                        title="Insufficient Permissions"
                        message={permissionMessage}
                        requiredPermissions={requiredPermissions}
                        requireAllPermissions={requireAllPermissions}
                    />
                );
            }
            
            return (
                <Navigate 
                    to="/unauthorized" 
                    state={{ 
                        from: location, 
                        message: `Access denied. ${permissionMessage}` 
                    }} 
                    replace 
                />
            );
        }
    }

    // Check section-specific permissions
    if (section) {
        if (!hasSectionPermission(section, action)) {
            if (showUnauthorized) {
                return fallback || (
                    <UnauthorizedPage 
                        title="Section Access Denied"
                        message={`You do not have permission to ${action} ${section}.`}
                        section={section}
                        action={action}
                    />
                );
            }
            
            return (
                <Navigate 
                    to="/unauthorized" 
                    state={{ 
                        from: location, 
                        message: `Access denied. Cannot ${action} ${section}.` 
                    }} 
                    replace 
                />
            );
        }
    }

    // All checks passed, render children
    return children;
};

/**
 * Higher-Order Component for route protection
 * 
 * @param {React.Component} Component - Component to wrap
 * @param {Object} protectionConfig - Protection configuration
 */
export const withProtection = (Component, protectionConfig = {}) => {
    const ProtectedComponent = (props) => {
        return (
            <ProtectedRoute {...protectionConfig}>
                <Component {...props} />
            </ProtectedRoute>
        );
    };
    
    ProtectedComponent.displayName = `Protected(${Component.displayName || Component.name})`;
    
    return ProtectedComponent;
};

/**
 * Hook for conditional rendering based on permissions
 */
export const useConditionalRender = () => {
    const { isAuthenticated } = useAuth();
    const permissions = usePermissions();

    /**
     * Render component conditionally based on permissions
     * 
     * @param {Object} config - Configuration object
     * @param {React.ReactNode} config.children - Component to render
     * @param {string} config.requiredRole - Required role
     * @param {Array<string>} config.requiredRoles - Required roles (any)
     * @param {string} config.requiredPermission - Required permission
     * @param {Array<string>} config.requiredPermissions - Required permissions
     * @param {boolean} config.requireAllPermissions - Require all permissions
     * @param {string} config.section - Section name
     * @param {string} config.action - Action name
     * @param {React.ReactNode} config.fallback - Fallback component
     */
    const renderIf = ({
        children,
        requiredRole,
        requiredRoles = [],
        requiredPermission,
        requiredPermissions = [],
        requireAllPermissions = false,
        section,
        action = 'view',
        fallback = null
    }) => {
        if (!isAuthenticated) {
            return fallback;
        }

        // Check role
        if (requiredRole && !permissions.hasRole(requiredRole)) {
            return fallback;
        }

        // Check multiple roles
        if (requiredRoles.length > 0 && !requiredRoles.some(role => permissions.hasRole(role))) {
            return fallback;
        }

        // Check single permission
        if (requiredPermission && !permissions.hasAnyPermission([requiredPermission])) {
            return fallback;
        }

        // Check multiple permissions
        if (requiredPermissions.length > 0) {
            const hasAccess = requireAllPermissions
                ? permissions.hasAllPermissions(requiredPermissions)
                : permissions.hasAnyPermission(requiredPermissions);
            
            if (!hasAccess) {
                return fallback;
            }
        }

        // Check section permission
        if (section && !permissions.hasSectionPermission(section, action)) {
            return fallback;
        }

        return children;
    };

    return { renderIf };
};

/**
 * Predefined protection configurations for common use cases
 */
export const ProtectionConfigs = {
    // Admin only
    AdminOnly: {
        requiredRole: 'Admin',
        showUnauthorized: true
    },
    
    // Employee access (any employee role)
    EmployeeOnly: {
        requiredRoles: ['Admin', 'TransactionManager', 'InventoryManager', 'UserManager', 'OrderSupport', 'Employee'],
        showUnauthorized: true
    },
    
    // Customer only
    CustomerOnly: {
        requiredRole: 'Customer',
        showUnauthorized: true
    },
    
    // Manager level access
    ManagerOnly: {
        requiredRoles: ['Admin', 'TransactionManager', 'InventoryManager', 'UserManager'],
        showUnauthorized: true
    },
    
    // Support access
    SupportAccess: {
        requiredRoles: ['Admin', 'OrderSupport', 'UserManager'],
        showUnauthorized: true
    },

    // Inventory management
    InventoryAccess: {
        section: 'inventory',
        action: 'view',
        showUnauthorized: true
    },
    
    // Order management
    OrderManagement: {
        section: 'orders',
        action: 'update',
        showUnauthorized: true
    },
    
    // User management
    UserManagement: {
        section: 'users',
        action: 'view',
        showUnauthorized: true
    }
};

export default ProtectedRoute;
