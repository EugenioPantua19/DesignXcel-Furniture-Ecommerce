/**
 * Permissions Hook
 * Provides role-based permissions checking and utilities
 * Works in conjunction with useAuth hook
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Role hierarchy definition (higher number = more permissions)
 */
const ROLE_HIERARCHY = {
    'Customer': 1,
    'Employee': 2,
    'OrderSupport': 3,
    'InventoryManager': 4,
    'UserManager': 4,
    'TransactionManager': 4,
    'Admin': 5
};

/**
 * Default permissions for each role
 */
const ROLE_PERMISSIONS = {
    'Customer': [
        'view_products',
        'add_to_cart',
        'place_orders',
        'view_own_orders',
        'update_profile',
        'view_order_history',
        'cancel_own_orders'
    ],
    'Employee': [
        'view_products',
        'access_employee_dashboard',
        'view_basic_reports'
    ],
    'OrderSupport': [
        'view_products',
        'access_employee_dashboard',
        'view_all_orders',
        'manage_orders',
        'customer_support',
        'update_order_status',
        'view_customer_details',
        'process_refunds'
    ],
    'InventoryManager': [
        'view_products',
        'access_employee_dashboard',
        'manage_inventory',
        'manage_products',
        'view_inventory_reports',
        'update_stock_levels',
        'manage_suppliers',
        'view_product_analytics'
    ],
    'UserManager': [
        'view_products',
        'access_employee_dashboard',
        'manage_customers',
        'view_user_reports',
        'customer_support',
        'manage_customer_accounts',
        'view_customer_analytics'
    ],
    'TransactionManager': [
        'view_products',
        'access_employee_dashboard',
        'manage_transactions',
        'view_financial_reports',
        'manage_payments',
        'process_refunds',
        'view_payment_analytics',
        'manage_pricing'
    ],
    'Admin': [
        'view_products',
        'add_to_cart',
        'place_orders',
        'view_own_orders',
        'update_profile',
        'access_employee_dashboard',
        'access_admin_dashboard',
        'manage_inventory',
        'manage_products',
        'view_all_orders',
        'manage_orders',
        'manage_users',
        'manage_customers',
        'manage_transactions',
        'view_analytics',
        'system_settings',
        'manage_roles',
        'view_all_reports',
        'manage_cms',
        'manage_site_settings',
        'view_audit_logs',
        'manage_permissions',
        'backup_restore',
        'manage_employees'
    ]
};

/**
 * Dashboard sections and their required permissions
 */
const DASHBOARD_SECTIONS = {
    'overview': ['access_employee_dashboard'],
    'products': ['manage_products'],
    'inventory': ['manage_inventory'],
    'orders': ['view_all_orders'],
    'customers': ['manage_customers'],
    'users': ['manage_users'],
    'transactions': ['manage_transactions'],
    'analytics': ['view_analytics'],
    'reports': ['view_all_reports'],
    'settings': ['system_settings'],
    'cms': ['manage_cms'],
    'support': ['customer_support']
};

/**
 * Section permissions mapping for granular control
 */
const SECTION_PERMISSIONS = {
    'dashboard': {
        view: ['access_employee_dashboard'],
        admin: ['access_admin_dashboard']
    },
    'products': {
        view: ['view_products'],
        create: ['manage_products'],
        update: ['manage_products'],
        delete: ['manage_products']
    },
    'inventory': {
        view: ['view_products'],
        create: ['manage_inventory'],
        update: ['manage_inventory'],
        delete: ['manage_inventory']
    },
    'orders': {
        view: ['view_all_orders'],
        create: ['manage_orders'],
        update: ['manage_orders'],
        delete: ['manage_orders'],
        viewOwn: ['view_own_orders']
    },
    'customers': {
        view: ['manage_customers'],
        create: ['manage_customers'],
        update: ['manage_customers'],
        delete: ['manage_customers']
    },
    'users': {
        view: ['manage_users'],
        create: ['manage_users'],
        update: ['manage_users'],
        delete: ['manage_users']
    },
    'transactions': {
        view: ['manage_transactions'],
        create: ['manage_transactions'],
        update: ['manage_transactions'],
        delete: ['manage_transactions']
    },
    'analytics': {
        view: ['view_analytics']
    },
    'reports': {
        view: ['view_all_reports']
    },
    'settings': {
        view: ['system_settings'],
        update: ['system_settings']
    }
};

/**
 * Use Permissions Hook
 */
export const usePermissions = () => {
    const { user, isAuthenticated, permissions: userPermissions } = useAuth();

    /**
     * Get all permissions for current user
     */
    const allPermissions = useMemo(() => {
        if (!isAuthenticated || !user) return [];
        
        // Get role-based permissions
        const rolePerms = ROLE_PERMISSIONS[user.role] || [];
        
        // For employees, also check granular permissions from backend
        if (user.type === 'employee' && userPermissions) {
            const granularPerms = [];
            
            Object.entries(userPermissions).forEach(([section, perms]) => {
                if (perms.canAccess) granularPerms.push(`access_${section}`);
                if (perms.canCreate) granularPerms.push(`create_${section}`);
                if (perms.canRead) granularPerms.push(`read_${section}`);
                if (perms.canUpdate) granularPerms.push(`update_${section}`);
                if (perms.canDelete) granularPerms.push(`delete_${section}`);
            });
            
            return [...new Set([...rolePerms, ...granularPerms])];
        }
        
        return rolePerms;
    }, [user, isAuthenticated, userPermissions]);

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission) => {
        if (!isAuthenticated || !user) return false;
        
        // Admin always has all permissions
        if (user.role === 'Admin') return true;
        
        return allPermissions.includes(permission);
    };

    /**
     * Check if user has any of the specified permissions
     */
    const hasAnyPermission = (permissions) => {
        if (!Array.isArray(permissions)) return false;
        return permissions.some(permission => hasPermission(permission));
    };

    /**
     * Check if user has all of the specified permissions
     */
    const hasAllPermissions = (permissions) => {
        if (!Array.isArray(permissions)) return false;
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
        
        const userLevel = ROLE_HIERARCHY[user.role] || 0;
        const requiredLevel = ROLE_HIERARCHY[role] || 0;
        
        return userLevel >= requiredLevel;
    };

    /**
     * Check section-specific permissions
     */
    const hasSectionPermission = (section, action = 'view') => {
        if (!isAuthenticated || !user) return false;
        
        // Admin always has access
        if (user.role === 'Admin') return true;
        
        // Check if section permissions are defined
        const sectionPerms = SECTION_PERMISSIONS[section];
        if (!sectionPerms || !sectionPerms[action]) return false;
        
        // Check if user has required permissions for this section action
        return hasAnyPermission(sectionPerms[action]);
    };

    /**
     * Check if user can access dashboard section
     */
    const canAccessDashboardSection = (section) => {
        if (!isAuthenticated || !user) return false;
        
        // Customers can't access employee dashboard sections
        if (user.role === 'Customer') return false;
        
        // Admin always has access
        if (user.role === 'Admin') return true;
        
        const requiredPermissions = DASHBOARD_SECTIONS[section];
        if (!requiredPermissions) return false;
        
        return hasAllPermissions(requiredPermissions);
    };

    /**
     * Get all accessible dashboard sections for current user
     */
    const getAccessibleDashboardSections = () => {
        if (!isAuthenticated || !user) return [];
        
        // Customers have no dashboard sections
        if (user.role === 'Customer') return [];
        
        // Admin has access to all sections
        if (user.role === 'Admin') {
            return Object.keys(DASHBOARD_SECTIONS);
        }
        
        return Object.keys(DASHBOARD_SECTIONS).filter(section => 
            canAccessDashboardSection(section)
        );
    };

    /**
     * Role check utilities
     */
    const isAdmin = () => hasRole('Admin');
    const isEmployee = () => hasRoleOrHigher('Employee') && user?.role !== 'Customer';
    const isCustomer = () => hasRole('Customer');
    const isManager = () => hasRoleOrHigher('InventoryManager');
    const isSupport = () => hasRoleOrHigher('OrderSupport');

    /**
     * Permission check utilities for common actions
     */
    const canManageProducts = () => hasPermission('manage_products');
    const canManageInventory = () => hasPermission('manage_inventory');
    const canManageOrders = () => hasPermission('manage_orders');
    const canManageUsers = () => hasPermission('manage_users');
    const canManageCustomers = () => hasPermission('manage_customers');
    const canManageTransactions = () => hasPermission('manage_transactions');
    const canViewAnalytics = () => hasPermission('view_analytics');
    const canAccessSettings = () => hasPermission('system_settings');

    /**
     * UI-specific permission checks
     */
    const canCreateProduct = () => hasSectionPermission('products', 'create');
    const canEditProduct = () => hasSectionPermission('products', 'update');
    const canDeleteProduct = () => hasSectionPermission('products', 'delete');
    
    const canCreateOrder = () => hasSectionPermission('orders', 'create');
    const canEditOrder = () => hasSectionPermission('orders', 'update');
    const canViewAllOrders = () => hasSectionPermission('orders', 'view');
    const canViewOwnOrders = () => hasSectionPermission('orders', 'viewOwn');
    
    const canCreateUser = () => hasSectionPermission('users', 'create');
    const canEditUser = () => hasSectionPermission('users', 'update');
    const canDeleteUser = () => hasSectionPermission('users', 'delete');

    /**
     * Get user's role level
     */
    const getUserRoleLevel = () => {
        if (!user) return 0;
        return ROLE_HIERARCHY[user.role] || 0;
    };

    /**
     * Check if user can perform action on entity owned by another user
     */
    const canAccessOtherUserData = (targetUserId) => {
        if (!user) return false;
        
        // Users can always access their own data
        if (user.id === targetUserId) return true;
        
        // Admin and managers can access other user data
        return isAdmin() || isManager();
    };

    /**
     * Get filtered navigation items based on permissions
     */
    const getNavigationItems = () => {
        const items = [];
        
        if (canAccessDashboardSection('overview')) {
            items.push({ key: 'dashboard', label: 'Dashboard', path: '/dashboard' });
        }
        
        if (canAccessDashboardSection('products')) {
            items.push({ key: 'products', label: 'Products', path: '/products' });
        }
        
        if (canAccessDashboardSection('inventory')) {
            items.push({ key: 'inventory', label: 'Inventory', path: '/inventory' });
        }
        
        if (canAccessDashboardSection('orders')) {
            items.push({ key: 'orders', label: 'Orders', path: '/orders' });
        }
        
        if (canAccessDashboardSection('customers')) {
            items.push({ key: 'customers', label: 'Customers', path: '/customers' });
        }
        
        if (canAccessDashboardSection('users')) {
            items.push({ key: 'users', label: 'Users', path: '/users' });
        }
        
        if (canAccessDashboardSection('transactions')) {
            items.push({ key: 'transactions', label: 'Transactions', path: '/transactions' });
        }
        
        if (canAccessDashboardSection('analytics')) {
            items.push({ key: 'analytics', label: 'Analytics', path: '/analytics' });
        }
        
        if (canAccessDashboardSection('reports')) {
            items.push({ key: 'reports', label: 'Reports', path: '/reports' });
        }
        
        if (canAccessDashboardSection('settings')) {
            items.push({ key: 'settings', label: 'Settings', path: '/settings' });
        }
        
        return items;
    };

    return {
        // Permission checks
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasSectionPermission,
        
        // Role checks
        hasRole,
        hasRoleOrHigher,
        isAdmin,
        isEmployee,
        isCustomer,
        isManager,
        isSupport,
        
        // Dashboard specific
        canAccessDashboardSection,
        getAccessibleDashboardSections,
        
        // Common action checks
        canManageProducts,
        canManageInventory,
        canManageOrders,
        canManageUsers,
        canManageCustomers,
        canManageTransactions,
        canViewAnalytics,
        canAccessSettings,
        
        // UI-specific checks
        canCreateProduct,
        canEditProduct,
        canDeleteProduct,
        canCreateOrder,
        canEditOrder,
        canViewAllOrders,
        canViewOwnOrders,
        canCreateUser,
        canEditUser,
        canDeleteUser,
        
        // Utilities
        getUserRoleLevel,
        canAccessOtherUserData,
        getNavigationItems,
        allPermissions,
        
        // Constants
        ROLE_HIERARCHY,
        ROLE_PERMISSIONS,
        DASHBOARD_SECTIONS,
        SECTION_PERMISSIONS
    };
};

export default usePermissions;
