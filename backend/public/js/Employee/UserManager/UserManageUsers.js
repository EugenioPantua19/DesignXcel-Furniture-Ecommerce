// User Manager Users JavaScript
// Handles user management functionality for user manager users

document.addEventListener('DOMContentLoaded', function() {
    // Initialize user manager user management functionality
    initializeUserManageUsers();
    
    // Load users data
    loadUsersData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeUserManageUsers() {
    console.log('Initializing User Manager Users...');
    
    // Initialize user management features
    initializeUserCRUD();
    initializeUserSearch();
}

function loadUsersData() {
    // Load users list
    loadUsers();
    
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
            <div class="user-info">
                <div class="user-name">${user.fullName}</div>
                <div class="user-email">${user.email}</div>
                <div class="user-role">${user.role}</div>
                <div class="user-status ${user.status}">${user.status}</div>
                <div class="user-last-login">Last Login: ${formatDate(user.lastLogin)}</div>
                <div class="user-created">Created: ${formatDate(user.createdAt)}</div>
            </div>
            <div class="user-actions">
                <button class="btn-edit" data-user-id="${user.id}">Edit</button>
                <button class="btn-role" data-user-id="${user.id}">Change Role</button>
                <button class="btn-status" data-user-id="${user.id}" data-status="${user.status}">
                    ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn-delete" data-user-id="${user.id}">Delete</button>
            </div>
        `;
        container.appendChild(userElement);
    });
}

function displayUserRoles(roles) {
    const container = document.getElementById('userRolesList');
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
            <div class="role-actions">
                <button class="btn-edit-role" data-role-id="${role.id}">Edit Role</button>
                <button class="btn-delete-role" data-role-id="${role.id}">Delete Role</button>
            </div>
        `;
        container.appendChild(roleElement);
    });
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
    const container = document.getElementById('userStatistics');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${statistics.totalUsers}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${statistics.activeUsers}</div>
            <div class="stat-label">Active Users</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${statistics.newUsersToday}</div>
            <div class="stat-label">New Today</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${statistics.adminUsers}</div>
            <div class="stat-label">Admin Users</div>
        </div>
    `;
}

function initializeUserCRUD() {
    console.log('User CRUD operations initialized');
}

function initializeUserSearch() {
    console.log('User search functionality initialized');
}

function setupEventListeners() {
    // User action buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
            const userId = e.target.getAttribute('data-user-id');
            editUser(userId);
        }
        
        if (e.target.classList.contains('btn-role')) {
            const userId = e.target.getAttribute('data-user-id');
            changeUserRole(userId);
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
        
        if (e.target.classList.contains('btn-edit-role')) {
            const roleId = e.target.getAttribute('data-role-id');
            editRole(roleId);
        }
        
        if (e.target.classList.contains('btn-delete-role')) {
            const roleId = e.target.getAttribute('data-role-id');
            deleteRole(roleId);
        }
        
        // Handle toggle buttons for user status
        if (e.target.classList.contains('toggle-btn')) {
            const userId = e.target.getAttribute('data-userid');
            const newStatus = e.target.getAttribute('data-newstatus');
            toggleUserStatusById(userId, newStatus);
        }
    });
}

function editUser(userId) {
    window.location.href = `/Employee/UserManager/EditUser/${userId}`;
}

function changeUserRole(userId) {
    window.location.href = `/Employee/UserManager/ChangeUserRole/${userId}`;
}

function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user?`, 'Change User Status')
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
                            window.EmployeeUtils.showNotification(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
                            loadUsers(); // Refresh the users list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to update user status', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error updating user status:', error);
                        window.EmployeeUtils.showNotification('Error updating user status', 'error');
                    });
                }
            });
    }
}

function toggleUserStatusById(userId, newStatus) {
    if (confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user?`)) {
        fetch(`/Employee/UserManager/UserManageUsers/ToggleActive/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (response.ok) {
                showCustomPopup(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                alert('Failed to update user status');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating user status');
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
                            loadUsers(); // Refresh the users list
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
    window.location.href = `/Employee/UserManager/EditRole/${roleId}`;
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
                            loadUserRoles(); // Refresh the roles list
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

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showCustomPopup(message) {
    const popup = document.getElementById('customPopup');
    if (popup) {
        const messageElement = popup.querySelector('.custom-popup-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        popup.style.display = 'block';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    }
}

// Export functions for global access
window.UserManageUsers = {
    loadUsers,
    loadUserRoles,
    loadUserStatistics,
    createUser: handleCreateUser,
    editUser,
    deleteUser,
    changeUserRole,
    toggleUserStatus,
    initializeUserManageUsers
};