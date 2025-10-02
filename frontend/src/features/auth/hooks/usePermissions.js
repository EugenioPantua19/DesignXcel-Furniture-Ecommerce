import { useAuth } from './useAuth';

/**
 * Role-based permissions hook
 * Provides utilities for checking user permissions
 */
export const usePermissions = () => {
    const { user, isAuthenticated } = useAuth();

    // Define role hierarchy (higher number = more permissions)
    const roleHierarchy = {
        'Customer': 1,
        'Employee': 2,
        'Admin': 3
    };

    // Define permissions for each role
    const rolePermissions = {
        'Customer': [
            'view_products',
            'add_to_cart',
            'place_orders',
            'view_own_orders',
            'update_profile'
        ],
        'Employee': [
            'view_products',
            'add_to_cart',
            'place_orders',
            'view_own_orders',
            'update_profile',
            'access_admin_dashboard',
            'manage_inventory',
            'manage_products',
            'view_all_orders',
            'manage_orders'
        ],
        'Admin': [
            'view_products',
            'add_to_cart',
            'place_orders',
            'view_own_orders',
            'update_profile',
            'access_admin_dashboard',
            'manage_inventory',
            'manage_products',
            'view_all_orders',
            'manage_orders',
            'manage_suppliers',
            'manage_users',
            'view_analytics',
            'system_settings'
        ]
    };

    // Admin dashboard sections and their required permissions
    const adminSections = {
        'overview': ['access_admin_dashboard'],
        'inventory': ['manage_inventory'],
        'products': ['manage_products'],
        'orders': ['view_all_orders'],
        'suppliers': ['manage_suppliers'],
        'users': ['manage_users'],
        'analytics': ['view_analytics']
    };

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission) => {
        if (!isAuthenticated || !user) return false;
        
        const userPermissions = rolePermissions[user.role] || [];
        return userPermissions.includes(permission);
    };

    /**
     * Check if user has any of the specified permissions
     */
    const hasAnyPermission = (permissions) => {
        return permissions.some(permission => hasPermission(permission));
    };

    /**
     * Check if user has all of the specified permissions
     */
    const hasAllPermissions = (permissions) => {
        return permissions.every(permission => hasPermission(permission));
    };

    /**
     * Check if user has a specific role
     */
    const hasRole = (role) => {
        if (!isAuthenticated || !user) return false;
        return user.role === role;
    };

    /**
     * Check if user has role equal to or higher than specified role
     */
    const hasRoleOrHigher = (role) => {
        if (!isAuthenticated || !user) return false;
        
        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[role] || 0;
        
        return userLevel >= requiredLevel;
    };

    /**
     * Check if user can access admin dashboard
     */
    const canAccessAdmin = () => {
        return hasPermission('access_admin_dashboard');
    };

    /**
     * Check if user can access specific admin section
     */
    const canAccessAdminSection = (section) => {
        const requiredPermissions = adminSections[section] || [];
        return hasAllPermissions(requiredPermissions);
    };

    /**
     * Get all accessible admin sections for current user
     */
    const getAccessibleAdminSections = () => {
        if (!canAccessAdmin()) return [];
        
        return Object.keys(adminSections).filter(section => 
            canAccessAdminSection(section)
        );
    };

    /**
     * Check if user is admin
     */
    const isAdmin = () => hasRole('Admin');

    /**
     * Check if user is employee or higher
     */
    const isEmployee = () => hasRoleOrHigher('Employee');

    /**
     * Check if user is customer
     */
    const isCustomer = () => hasRole('Customer');

    /**
     * Get user's permissions list
     */
    const getUserPermissions = () => {
        if (!isAuthenticated || !user) return [];
        return rolePermissions[user.role] || [];
    };

    return {
        // Permission checks
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        
        // Role checks
        hasRole,
        hasRoleOrHigher,
        isAdmin,
        isEmployee,
        isCustomer,
        
        // Admin specific
        canAccessAdmin,
        canAccessAdminSection,
        getAccessibleAdminSections,
        
        // Utilities
        getUserPermissions,
        roleHierarchy,
        rolePermissions,
        adminSections
    };
};

export default usePermissions;
