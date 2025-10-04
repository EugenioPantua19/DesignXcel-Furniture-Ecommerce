// Admin Manage Users JavaScript
// Handles user management functionality for admin users

document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin user management functionality
    initializeAdminManageUsers();
    
    // Load users data
    loadUsersData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeAdminManageUsers() {
    console.log('Initializing Admin Manage Users...');
    
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
        setTimeout(initializeAdminManageUsers, 100);
        return;
    }
    
    // Initialize user management features
    initializeUserCRUD();
    initializePermissionManagement();
    initializeRoleManagement();
    initializeUserSearch();
}

function loadUsersData() {
    // Load users list
    loadUsers();
    
    // Load user roles
    loadUserRoles();
    
    // Load permission templates
    loadPermissionTemplates();
    
    // Load user statistics
    loadUserStatistics();
}

function loadUsers() {
    fetch('/api/admin/users')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayUsers(data.users);
            }
        })
        .catch(error => {
            console.error('Error loading users:', error);
        });
}

function displayUsers(users) {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <div class="user-header">
                <div class="user-avatar">
                    <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.name}" style="width: 40px; height: 40px; border-radius: 50%;">
                </div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-email">${user.email}</div>
                </div>
                <div class="user-status status-${user.status}">${user.status}</div>
            </div>
            <div class="user-details">
                <div class="user-role">Role: ${user.role}</div>
                <div class="user-last-login">Last Login: ${formatDate(user.lastLogin)}</div>
                <div class="user-created">Created: ${formatDate(user.createdAt)}</div>
            </div>
            <div class="user-actions">
                <button class="btn-edit" data-user-id="${user.id}">Edit</button>
                <button class="btn-permissions" data-user-id="${user.id}">Permissions</button>
                <button class="btn-role" data-user-id="${user.id}">Change Role</button>
                <button class="btn-status" data-user-id="${user.id}" data-status="${user.status}">
                    ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn-delete" data-user-id="${user.id}">Delete</button>
            </div>
        `;
        container.appendChild(userElement);
    });
    
    // Add event listeners
    setupUserActions();
}

function loadUserRoles() {
    fetch('/api/admin/roles')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayUserRoles(data.roles);
            }
        })
        .catch(error => {
            console.error('Error loading user roles:', error);
        });
}

function displayUserRoles(roles) {
    const container = document.getElementById('rolesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    roles.forEach(role => {
        const roleElement = document.createElement('div');
        roleElement.className = 'role-item';
        roleElement.innerHTML = `
            <div class="role-header">
                <div class="role-name">${role.name}</div>
                <div class="role-count">${role.userCount} users</div>
            </div>
            <div class="role-description">${role.description}</div>
            <div class="role-permissions">
                <div class="permissions-list">
                    ${role.permissions.map(permission => 
                        `<span class="permission-tag">${permission}</span>`
                    ).join('')}
                </div>
            </div>
            <div class="role-actions">
                <button class="btn-edit-role" data-role-id="${role.id}">Edit Role</button>
                <button class="btn-delete-role" data-role-id="${role.id}">Delete Role</button>
            </div>
        `;
        container.appendChild(roleElement);
    });
    
    // Add event listeners
    setupRoleActions();
}

function loadPermissionTemplates() {
    fetch('/api/admin/permission-templates')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPermissionTemplates(data.templates);
            }
        })
        .catch(error => {
            console.error('Error loading permission templates:', error);
        });
}

function displayPermissionTemplates(templates) {
    const container = document.getElementById('permissionTemplatesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    templates.forEach(template => {
        const templateElement = document.createElement('div');
        templateElement.className = 'permission-template-item';
        templateElement.innerHTML = `
            <div class="template-header">
                <div class="template-name">${template.name}</div>
                <div class="template-description">${template.description}</div>
            </div>
            <div class="template-permissions">
                <div class="permissions-grid">
                    ${Object.entries(template.permissions).map(([section, permissions]) => `
                        <div class="permission-section">
                            <div class="section-name">${section}</div>
                            <div class="section-permissions">
                                ${permissions.map(permission => 
                                    `<span class="permission-item">${permission}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="template-actions">
                <button class="btn-apply" data-template-id="${template.id}">Apply Template</button>
                <button class="btn-edit-template" data-template-id="${template.id}">Edit Template</button>
            </div>
        `;
        container.appendChild(templateElement);
    });
    
    // Add event listeners
    setupTemplateActions();
}

function loadUserStatistics() {
    fetch('/api/admin/users/statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayUserStatistics(data.statistics);
            }
        })
        .catch(error => {
            console.error('Error loading user statistics:', error);
        });
}

function displayUserStatistics(statistics) {
    // Update statistics cards
    updateStatCard('totalUsers', statistics.totalUsers);
    updateStatCard('activeUsers', statistics.activeUsers);
    updateStatCard('newUsersToday', statistics.newUsersToday);
    updateStatCard('adminUsers', statistics.adminUsers);
    
    // Update role distribution chart
    updateRoleDistributionChart(statistics.roleDistribution);
    
    // Update user activity chart
    updateUserActivityChart(statistics.userActivity);
}

function updateStatCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        card.textContent = value || 0;
    }
}

function updateRoleDistributionChart(roleDistribution) {
    const chartContainer = document.getElementById('roleDistributionChart');
    if (!chartContainer || !roleDistribution) return;
    
    // Create a simple bar chart
    chartContainer.innerHTML = '';
    
    Object.entries(roleDistribution).forEach(([role, count]) => {
        const barElement = document.createElement('div');
        barElement.className = 'role-bar';
        barElement.innerHTML = `
            <div class="role-name">${role}</div>
            <div class="role-bar-fill" style="width: ${(count / Math.max(...Object.values(roleDistribution))) * 100}%"></div>
            <div class="role-count">${count}</div>
        `;
        chartContainer.appendChild(barElement);
    });
}

function updateUserActivityChart(userActivity) {
    const chartContainer = document.getElementById('userActivityChart');
    if (!chartContainer || !userActivity) return;
    
    // Create a simple line chart
    chartContainer.innerHTML = '';
    
    const maxActivity = Math.max(...userActivity.map(day => day.count));
    
    userActivity.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'activity-day';
        dayElement.innerHTML = `
            <div class="day-name">${day.day}</div>
            <div class="day-bar" style="height: ${(day.count / maxActivity) * 100}%"></div>
            <div class="day-count">${day.count}</div>
        `;
        chartContainer.appendChild(dayElement);
    });
}

function initializeUserCRUD() {
    console.log('User CRUD initialized');
    
    // Setup user creation
    setupUserCreation();
    
    // Setup user editing
    setupUserEditing();
    
    // Setup user deletion
    setupUserDeletion();
}

function setupUserCreation() {
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateUser(this);
        });
    }
}

function handleCreateUser(form) {
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData);
    
    // Validate form data
    const validation = validateUserData(userData);
    if (!validation.isValid) {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(validation.errors.join(', '), 'error');
        }
        return;
    }
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showLoading('createUserStatus', 'Creating user...');
    }
    
    fetch('/api/admin/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('User created successfully!');
            }
            form.reset();
            loadUsers(); // Refresh users list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to create user: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error creating user:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error creating user', 'error');
        }
    })
    .finally(() => {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.hideLoading('createUserStatus');
        }
    });
}

function setupUserEditing() {
    // Setup user editing functionality
    console.log('User editing setup completed');
}

function setupUserDeletion() {
    // Setup user deletion functionality
    console.log('User deletion setup completed');
}

function initializePermissionManagement() {
    console.log('Permission management initialized');
    
    // Setup permission updates
    setupPermissionUpdates();
    
    // Setup permission templates
    setupPermissionTemplates();
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
    
    fetch(`/api/admin/users/${userId}/permissions/${permission}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ canAccess: newValue })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification(`Permission ${action}ed successfully!`);
            }
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification(`Failed to ${action} permission`, 'error');
            }
        }
    })
    .catch(error => {
        console.error(`Error ${action}ing permission:`, error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(`Error ${action}ing permission`, 'error');
        }
    });
}

function setupPermissionTemplates() {
    // Setup permission template application
    console.log('Permission templates setup completed');
}

function initializeRoleManagement() {
    console.log('Role management initialized');
    
    // Setup role changes
    setupRoleChanges();
    
    // Setup role creation
    setupRoleCreation();
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
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm(`Are you sure you want to change this user's role to ${newRole}?`, 'Change User Role')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/admin/users/${userId}/role`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ role: newRole })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('User role updated successfully!');
                            loadUsers(); // Refresh users list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to update user role', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error updating user role:', error);
                        window.EmployeeUtils.showNotification('Error updating user role', 'error');
                    });
                }
            });
    }
}

function setupRoleCreation() {
    // Setup role creation functionality
    console.log('Role creation setup completed');
}

function initializeUserSearch() {
    console.log('User search initialized');
    
    // Setup search functionality
    setupUserSearch();
    
    // Setup filtering
    setupUserFiltering();
}

function setupUserSearch() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchUsers(this.value);
        });
    }
}

function searchUsers(searchTerm) {
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function setupUserFiltering() {
    // Filter by role
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            filterUsersByRole(this.value);
        });
    }
    
    // Filter by status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterUsersByStatus(this.value);
        });
    }
}

function filterUsersByRole(role) {
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const userRole = item.querySelector('.user-role').textContent;
        if (role === 'all' || userRole.includes(role)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterUsersByStatus(status) {
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const userStatus = item.querySelector('.user-status').textContent;
        if (status === 'all' || userStatus.includes(status)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function setupEventListeners() {
    // Setup user actions
    setupUserActions();
    
    // Setup role actions
    setupRoleActions();
    
    // Setup template actions
    setupTemplateActions();
    
    // Setup bulk actions
    setupBulkActions();
}

function setupUserActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
            const userId = e.target.getAttribute('data-user-id');
            editUser(userId);
        }
        
        if (e.target.classList.contains('btn-permissions')) {
            const userId = e.target.getAttribute('data-user-id');
            manageUserPermissions(userId);
        }
        
        if (e.target.classList.contains('btn-role')) {
            const userId = e.target.getAttribute('data-user-id');
            changeUserRoleModal(userId);
        }
        
        if (e.target.classList.contains('btn-status')) {
            const userId = e.target.getAttribute('data-user-id');
            const currentStatus = e.target.getAttribute('data-status');
            toggleUserStatus(userId, currentStatus);
        }
        
        if (e.target.classList.contains('btn-delete')) {
            const userId = e.target.getAttribute('data-user-id');
            deleteUser(userId);
        }
    });
}

function setupRoleActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit-role')) {
            const roleId = e.target.getAttribute('data-role-id');
            editRole(roleId);
        }
        
        if (e.target.classList.contains('btn-delete-role')) {
            const roleId = e.target.getAttribute('data-role-id');
            deleteRole(roleId);
        }
    });
}

function setupTemplateActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-apply')) {
            const templateId = e.target.getAttribute('data-template-id');
            applyPermissionTemplate(templateId);
        }
        
        if (e.target.classList.contains('btn-edit-template')) {
            const templateId = e.target.getAttribute('data-template-id');
            editPermissionTemplate(templateId);
        }
    });
}

function setupBulkActions() {
    // Setup bulk user actions
    const bulkActionSelect = document.getElementById('bulkActionSelect');
    const bulkActionButton = document.getElementById('bulkActionButton');
    
    if (bulkActionSelect && bulkActionButton) {
        bulkActionButton.addEventListener('click', function() {
            const action = bulkActionSelect.value;
            const selectedUsers = getSelectedUsers();
            
            if (selectedUsers.length === 0) {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Please select users first', 'warning');
                }
                return;
            }
            
            performBulkAction(action, selectedUsers);
        });
    }
}

function getSelectedUsers() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

function performBulkAction(action, userIds) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm(`Are you sure you want to ${action} ${userIds.length} users?`, 'Bulk Action')
            .then(confirmed => {
                if (confirmed) {
                    fetch('/api/admin/users/bulk-action', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ action, userIds })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification(`Bulk ${action} completed successfully!`);
                            loadUsers(); // Refresh users list
                        } else {
                            window.EmployeeUtils.showNotification(`Bulk ${action} failed`, 'error');
                        }
                    })
                    .catch(error => {
                        console.error(`Error performing bulk ${action}:`, error);
                        window.EmployeeUtils.showNotification(`Error performing bulk ${action}`, 'error');
                    });
                }
            });
    }
}

// Action functions
function editUser(userId) {
    window.location.href = `/Employee/Admin/EditUser/${userId}`;
}

function manageUserPermissions(userId) {
    window.location.href = `/Employee/Admin/UserPermissions/${userId}`;
}

function changeUserRoleModal(userId) {
    // Open role change modal
    const modal = document.getElementById('changeRoleModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('changeRoleUserId').value = userId;
    }
}

function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm(`Are you sure you want to ${newStatus} this user?`, 'Change User Status')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/admin/users/${userId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: newStatus })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification(`User ${newStatus}d successfully!`);
                            loadUsers(); // Refresh users list
                        } else {
                            window.EmployeeUtils.showNotification(`Failed to ${newStatus} user`, 'error');
                        }
                    })
                    .catch(error => {
                        console.error(`Error ${newStatus}ing user:`, error);
                        window.EmployeeUtils.showNotification(`Error ${newStatus}ing user`, 'error');
                    });
                }
            });
    }
}

function deleteUser(userId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to delete this user? This action cannot be undone.', 'Delete User')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/admin/users/${userId}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('User deleted successfully!');
                            loadUsers(); // Refresh users list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to delete user', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting user:', error);
                        window.EmployeeUtils.showNotification('Error deleting user', 'error');
                    });
                }
            });
    }
}

function editRole(roleId) {
    window.location.href = `/Employee/Admin/EditRole/${roleId}`;
}

function deleteRole(roleId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to delete this role?', 'Delete Role')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/admin/roles/${roleId}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Role deleted successfully!');
                            loadUserRoles(); // Refresh roles list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to delete role', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting role:', error);
                        window.EmployeeUtils.showNotification('Error deleting role', 'error');
                    });
                }
            });
    }
}

function applyPermissionTemplate(templateId) {
    const selectedUsers = getSelectedUsers();
    
    if (selectedUsers.length === 0) {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Please select users first', 'warning');
        }
        return;
    }
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm(`Apply permission template to ${selectedUsers.length} users?`, 'Apply Template')
            .then(confirmed => {
                if (confirmed) {
                    fetch('/api/admin/users/apply-template', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ templateId, userIds: selectedUsers })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Permission template applied successfully!');
                        } else {
                            window.EmployeeUtils.showNotification('Failed to apply template', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error applying template:', error);
                        window.EmployeeUtils.showNotification('Error applying template', 'error');
                    });
                }
            });
    }
}

function editPermissionTemplate(templateId) {
    window.location.href = `/Employee/Admin/EditPermissionTemplate/${templateId}`;
}

function validateUserData(userData) {
    const errors = [];
    
    if (!userData.name || userData.name.trim() === '') {
        errors.push('Name is required');
    }
    
    if (!userData.email || userData.email.trim() === '') {
        errors.push('Email is required');
    } else if (!isValidEmail(userData.email)) {
        errors.push('Invalid email format');
    }
    
    if (!userData.password || userData.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    if (!userData.role || userData.role.trim() === '') {
        errors.push('Role is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions for use in other modules
window.AdminManageUsers = {
    loadUsersData,
    loadUsers,
    loadUserRoles,
    loadPermissionTemplates,
    loadUserStatistics,
    createUser: handleCreateUser,
    editUser,
    deleteUser,
    changeUserRole,
    toggleUserStatus,
    manageUserPermissions,
    applyPermissionTemplate,
    editPermissionTemplate,
    initializeAdminManageUsers
};