// User Manager JavaScript
// Handles user management functionality and permissions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize user manager functionality
    initializeUserManager();
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeUserManager() {
    console.log('Initializing User Manager...');
    
    // Wait for userPermissions to be initialized
    if (window.userPermissions) {
        // Check if user has user management permissions
        if (!window.userPermissions.hasPermission('users')) {
            console.log('User does not have user management permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        
        // Update UI based on permissions
        window.userPermissions.updateUI();
    } else {
        // Fallback: wait a bit and try again
        setTimeout(initializeUserManager, 100);
        return;
    }
    
    // Initialize user management features
    initializeUserManagement();
    initializePermissionManagement();
    initializeRoleManagement();
}

function loadDashboardData() {
    // Load user metrics
    loadUserMetrics();
    
    // Load recent user activity
    loadRecentUserActivity();
    
    // Load permission changes
    loadPermissionChanges();
}

function loadUserMetrics() {
    fetch('/api/users/metrics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateUserMetrics(data.metrics);
            }
        })
        .catch(error => {
            console.error('Error loading user metrics:', error);
        });
}

function updateUserMetrics(metrics) {
    // Update total users
    const totalUsers = document.getElementById('totalUsers');
    if (totalUsers) {
        totalUsers.textContent = metrics.totalUsers || 0;
    }
    
    // Update active users
    const activeUsers = document.getElementById('activeUsers');
    if (activeUsers) {
        activeUsers.textContent = metrics.activeUsers || 0;
    }
    
    // Update new users today
    const newUsersToday = document.getElementById('newUsersToday');
    if (newUsersToday) {
        newUsersToday.textContent = metrics.newUsersToday || 0;
    }
    
    // Update role distribution
    updateRoleDistribution(metrics.roleDistribution);
}

function updateRoleDistribution(roleDistribution) {
    const roleContainer = document.getElementById('roleDistribution');
    if (!roleContainer || !roleDistribution) return;
    
    roleContainer.innerHTML = '';
    
    Object.entries(roleDistribution).forEach(([role, count]) => {
        const roleElement = document.createElement('div');
        roleElement.className = 'role-item';
        roleElement.innerHTML = `
            <div class="role-name">${role}</div>
            <div class="role-count">${count} users</div>
        `;
        roleContainer.appendChild(roleElement);
    });
}

function loadRecentUserActivity() {
    fetch('/api/users/activity/recent')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayRecentUserActivity(data.activity);
            }
        })
        .catch(error => {
            console.error('Error loading recent user activity:', error);
        });
}

function displayRecentUserActivity(activity) {
    const activityContainer = document.getElementById('recentUserActivity');
    if (!activityContainer) return;
    
    activityContainer.innerHTML = '';
    
    activity.forEach(item => {
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <div class="activity-info">
                <div class="activity-action">${item.action}</div>
                <div class="activity-user">User: ${item.userName}</div>
                <div class="activity-timestamp">${item.timestamp}</div>
            </div>
        `;
        activityContainer.appendChild(activityElement);
    });
}

function loadPermissionChanges() {
    fetch('/api/users/permissions/changes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPermissionChanges(data.changes);
            }
        })
        .catch(error => {
            console.error('Error loading permission changes:', error);
        });
}

function displayPermissionChanges(changes) {
    const changesContainer = document.getElementById('permissionChanges');
    if (!changesContainer) return;
    
    changesContainer.innerHTML = '';
    
    changes.forEach(change => {
        const changeElement = document.createElement('div');
        changeElement.className = 'permission-change-item';
        changeElement.innerHTML = `
            <div class="change-info">
                <div class="change-user">${change.userName}</div>
                <div class="change-permission">${change.permission}</div>
                <div class="change-action">${change.action}</div>
                <div class="change-timestamp">${change.timestamp}</div>
            </div>
        `;
        changesContainer.appendChild(changeElement);
    });
}

function initializeUserManagement() {
    // Initialize user management features
    console.log('User management initialized');
    
    // Setup user CRUD operations
    setupUserOperations();
}

function setupUserOperations() {
    // Setup user creation
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', handleCreateUser);
    }
    
    // Setup user editing
    const editUserButtons = document.querySelectorAll('[data-edit-user]');
    editUserButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-edit-user');
            editUser(userId);
        });
    });
    
    // Setup user deletion
    const deleteUserButtons = document.querySelectorAll('[data-delete-user]');
    deleteUserButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-delete-user');
            const userName = this.getAttribute('data-user-name');
            deleteUser(userId, userName);
        });
    });
}

function handleCreateUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData);
    
    fetch('/api/users/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('User created successfully!');
            event.target.reset();
            loadUserMetrics(); // Refresh metrics
        } else {
            showNotification(data.message || 'Failed to create user', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating user:', error);
        showNotification('Error creating user', 'error');
    });
}

function editUser(userId) {
    // Open edit user modal or redirect to edit page
    window.location.href = `/Employee/UserManager/EditUser?id=${userId}`;
}

function deleteUser(userId, userName) {
    if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
        fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('User deleted successfully!');
                loadUserMetrics(); // Refresh metrics
            } else {
                showNotification(data.message || 'Failed to delete user', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user', 'error');
        });
    }
}

function initializePermissionManagement() {
    // Initialize permission management features
    console.log('Permission management initialized');
    
    // Setup permission updates
    setupPermissionUpdates();
}

function setupPermissionUpdates() {
    // Setup permission change buttons
    const permissionButtons = document.querySelectorAll('[data-permission-action]');
    permissionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-permission-action');
            const userId = this.getAttribute('data-user-id');
            const permission = this.getAttribute('data-permission');
            handlePermissionChange(action, userId, permission);
        });
    });
}

function handlePermissionChange(action, userId, permission) {
    const newValue = action === 'grant';
    
    fetch(`/api/users/${userId}/permissions/${permission}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ canAccess: newValue })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Permission ${action}ed successfully!`);
            loadPermissionChanges(); // Refresh permission changes
        } else {
            showNotification(data.message || `Failed to ${action} permission`, 'error');
        }
    })
    .catch(error => {
        console.error(`Error ${action}ing permission:`, error);
        showNotification(`Error ${action}ing permission`, 'error');
    });
}

function initializeRoleManagement() {
    // Initialize role management features
    console.log('Role management initialized');
    
    // Setup role changes
    setupRoleChanges();
}

function setupRoleChanges() {
    // Setup role change dropdowns
    const roleSelects = document.querySelectorAll('[data-role-change]');
    roleSelects.forEach(select => {
        select.addEventListener('change', function() {
            const userId = this.getAttribute('data-role-change');
            const newRole = this.value;
            changeUserRole(userId, newRole);
        });
    });
}

function changeUserRole(userId, newRole) {
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        fetch(`/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('User role updated successfully!');
                loadUserMetrics(); // Refresh metrics
            } else {
                showNotification(data.message || 'Failed to update user role', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating user role:', error);
            showNotification('Error updating user role', 'error');
        });
    }
}

function setupEventListeners() {
    // Setup logout functionality
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Setup navigation
    setupNavigation();
}

function setupNavigation() {
    // Handle navigation clicks
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                // Check permissions before navigation
                if (window.userPermissions && !window.userPermissions.canAccessPage(href)) {
                    e.preventDefault();
                    window.userPermissions.showAccessDenied('this section');
                }
            }
        });
    });
}

function handleLogout(event) {
    event.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/login';
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
            // Fallback to direct redirect
            window.location.href = '/login';
        });
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        border-radius: 4px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export functions for use in other modules
window.UserManager = {
    loadDashboardData,
    loadUserMetrics,
    loadRecentUserActivity,
    loadPermissionChanges,
    handleCreateUser,
    editUser,
    deleteUser,
    handlePermissionChange,
    changeUserRole,
    initializeUserManager
};
