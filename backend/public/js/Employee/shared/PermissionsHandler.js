// Employee Permissions Handler
// Handles permission checking and access control across all Employee modules

class PermissionsHandler {
    constructor() {
        this.permissions = {};
        this.userRole = null;
        this.userId = null;
        this.initialized = false;
    }

    // Initialize permissions from server
    async initialize() {
        try {
            const response = await fetch('/api/employee/permissions');
            const data = await response.json();
            
            if (data.success) {
                this.permissions = data.permissions || {};
                this.userRole = data.userRole;
                this.userId = data.userId;
                this.initialized = true;
                
                console.log('Permissions initialized:', this.permissions);
                return true;
            } else {
                console.error('Failed to initialize permissions:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error initializing permissions:', error);
            return false;
        }
    }

    // Check if user has specific permission
    hasPermission(permission) {
        if (!this.initialized) {
            console.warn('Permissions not initialized');
            return false;
        }
        
        return this.permissions[permission] === true;
    }

    // Check if user can access a specific page
    canAccessPage(page) {
        const pagePermissions = {
            '/Employee/Admin': ['admin', 'logs'],
            '/Employee/Inventory': ['inventory', 'alerts'],
            '/Employee/Transaction': ['transactions', 'orders'],
            '/Employee/Support': ['chat', 'support'],
            '/Employee/UserManager': ['users', 'user_management']
        };

        const requiredPermissions = pagePermissions[page];
        if (!requiredPermissions) return true;

        return requiredPermissions.some(permission => this.hasPermission(permission));
    }

    // Check if user can perform specific action
    canPerformAction(action, resource = null) {
        const actionPermissions = {
            'create': 'create',
            'read': 'read',
            'update': 'edit',
            'delete': 'delete',
            'manage': 'manage'
        };

        const permission = actionPermissions[action];
        if (!permission) return false;

        if (resource) {
            return this.hasPermission(`${resource}_${permission}`);
        }

        return this.hasPermission(permission);
    }

    // Get user role
    getUserRole() {
        return this.userRole;
    }

    // Get user ID
    getUserId() {
        return this.userId;
    }

    // Update UI based on permissions
    updateUI() {
        if (!this.initialized) return;

        // Hide/show elements based on permissions
        this.updatePermissionElements();
        
        // Update navigation
        this.updateNavigation();
        
        // Update buttons and actions
        this.updateActionButtons();
    }

    updatePermissionElements() {
        // Hide elements that user doesn't have permission for
        document.querySelectorAll('[data-permission]').forEach(element => {
            const requiredPermission = element.getAttribute('data-permission');
            if (!this.hasPermission(requiredPermission)) {
                element.style.display = 'none';
            }
        });

        // Disable elements that user doesn't have permission for
        document.querySelectorAll('[data-permission-readonly]').forEach(element => {
            const requiredPermission = element.getAttribute('data-permission-readonly');
            if (!this.hasPermission(requiredPermission)) {
                element.disabled = true;
                element.classList.add('disabled');
            }
        });
    }

    updateNavigation() {
        // Update navigation menu based on permissions
        const navItems = document.querySelectorAll('.sidebar-menu a[data-permission]');
        navItems.forEach(item => {
            const requiredPermission = item.getAttribute('data-permission');
            if (!this.hasPermission(requiredPermission)) {
                item.style.display = 'none';
            }
        });
    }

    updateActionButtons() {
        // Update action buttons based on permissions
        const actionButtons = document.querySelectorAll('[data-action-permission]');
        actionButtons.forEach(button => {
            const requiredPermission = button.getAttribute('data-action-permission');
            if (!this.hasPermission(requiredPermission)) {
                button.disabled = true;
                button.classList.add('disabled');
            }
        });
    }

    // Redirect to forbidden page
    redirectToForbidden() {
        window.location.href = '/Employee/Forbidden';
    }

    // Show access denied message
    showAccessDenied(resource = 'this resource') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(
                `Access denied. You don't have permission to access ${resource}.`,
                'error',
                5000
            );
        } else {
            alert(`Access denied. You don't have permission to access ${resource}.`);
        }
    }

    // Check if user is admin
    isAdmin() {
        return this.userRole === 'admin' || this.userRole === 'super_admin';
    }

    // Check if user is manager
    isManager() {
        return this.userRole === 'manager' || this.isAdmin();
    }

    // Get all permissions
    getAllPermissions() {
        return { ...this.permissions };
    }

    // Check multiple permissions (AND logic)
    hasAllPermissions(permissions) {
        return permissions.every(permission => this.hasPermission(permission));
    }

    // Check multiple permissions (OR logic)
    hasAnyPermission(permissions) {
        return permissions.some(permission => this.hasPermission(permission));
    }

    // Refresh permissions from server
    async refreshPermissions() {
        this.initialized = false;
        return await this.initialize();
    }

    // Set permission (for testing purposes)
    setPermission(permission, value) {
        this.permissions[permission] = value;
    }

    // Remove permission
    removePermission(permission) {
        delete this.permissions[permission];
    }
}

// Initialize global instance
window.userPermissions = new PermissionsHandler();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await window.userPermissions.initialize();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PermissionsHandler;
}
