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
    
    // Admin-only system - no permission checking needed
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
    // Users are already loaded from the server-side rendering
    // This function is kept for compatibility but doesn't need to fetch data
    console.log('Users data is already available from server-side rendering');
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
    // User roles are not needed for the current implementation
    // This function is kept for compatibility but doesn't fetch data
    console.log('User roles loading skipped - not implemented');
}

function loadUserStatistics() {
    // User statistics are not needed for the current implementation
    // This function is kept for compatibility but doesn't fetch data
    console.log('User statistics loading skipped - not implemented');
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
    });
}

function editUser(userId) {
    window.location.href = `/Employee/Admin/EditUser/${userId}`;
}

function changeUserRole(userId) {
    window.location.href = `/Employee/Admin/ChangeUserRole/${userId}`;
}

function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 0 : 1; // Convert to database format
    
    if (confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user?`)) {
        fetch(`/Employee/Admin/ManageUsers/ToggleActive/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
                location.reload(); // Refresh the page
            } else {
                alert('Failed to update user status');
            }
        })
        .catch(error => {
            console.error('Error updating user status:', error);
            alert('Error updating user status');
        });
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        // Note: User deletion is not implemented for security reasons
        // This function is kept for compatibility
        alert('User deletion is not available for security reasons. Please contact the system administrator.');
    }
}

function editRole(roleId) {
    window.location.href = `/Employee/Admin/EditRole/${roleId}`;
}

function deleteRole(roleId) {
    if (confirm('Are you sure you want to delete this role?')) {
        // Note: Role deletion is not implemented for security reasons
        // This function is kept for compatibility
        alert('Role deletion is not available for security reasons. Please contact the system administrator.');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function handleCreateUser() {
    // Create user functionality - redirect to create user page
    window.location.href = '/Employee/Admin/CreateUser';
}

// Export functions for global access
window.AdminManageUsers = {
    loadUsers,
    loadUserRoles,
    loadUserStatistics,
    createUser: handleCreateUser,
    editUser,
    deleteUser,
    changeUserRole,
    toggleUserStatus,
    initializeAdminManageUsers
};