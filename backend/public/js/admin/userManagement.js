/**
 * User Management JavaScript
 * Handles all frontend functionality for the enhanced user management system
 */

// Global variables
let currentEmployeePage = 1;
let currentCustomerPage = 1;
let employeesPerPage = 10;
let customersPerPage = 20;
let currentPermissionsUserId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadEmployees();
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search inputs
    document.getElementById('employee-search').addEventListener('input', debounce(loadEmployees, 300));
    document.getElementById('customer-search').addEventListener('input', debounce(loadCustomers, 300));
    
    // Filter selects
    document.getElementById('employee-role-filter').addEventListener('change', loadEmployees);
    document.getElementById('employee-status-filter').addEventListener('change', loadEmployees);
    document.getElementById('customer-status-filter').addEventListener('change', loadCustomers);
    
    // Form submission
    document.getElementById('employee-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEmployee();
    });
    
    // Modal click outside to close
    document.getElementById('employee-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEmployeeModal();
        }
    });
    
    document.getElementById('permissions-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePermissionsModal();
        }
    });
}

/**
 * Tab switching functionality
 */
function switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Load data based on tab
    switch(tabName) {
        case 'employees':
            loadEmployees();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'roles':
            loadRoles();
            break;
    }
}

/**
 * Load employees with filters and pagination
 */
async function loadEmployees() {
    const search = document.getElementById('employee-search').value;
    const roleFilter = document.getElementById('employee-role-filter').value;
    const statusFilter = document.getElementById('employee-status-filter').value;
    
    try {
        showLoading('employees-content');
        
        const response = await fetch('/api/users/employees');
        const data = await response.json();
        
        if (data.success) {
            renderEmployees(data.employees, search, roleFilter, statusFilter);
        } else {
            showError('Failed to load employees');
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        showError('Error loading employees');
    }
}

/**
 * Render employees table
 */
function renderEmployees(employees, search = '', roleFilter = '', statusFilter = '') {
    // Filter employees
    let filteredEmployees = employees.filter(emp => {
        const matchesSearch = !search || 
            emp.FullName.toLowerCase().includes(search.toLowerCase()) ||
            emp.Email.toLowerCase().includes(search.toLowerCase()) ||
            emp.Username.toLowerCase().includes(search.toLowerCase());
        
        const matchesRole = !roleFilter || emp.RoleName === roleFilter;
        const matchesStatus = statusFilter === '' || emp.IsActive.toString() === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    // Pagination
    const startIndex = (currentEmployeePage - 1) * employeesPerPage;
    const endIndex = startIndex + employeesPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
    
    let html = '';
    
    if (paginatedEmployees.length === 0) {
        html = `
            <div class="empty-state">
                <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                </svg>
                <h3>No employees found</h3>
                <p>Try adjusting your search criteria or create a new employee.</p>
            </div>
        `;
    } else {
        html = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedEmployees.map(emp => `
                        <tr>
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">
                                        ${getInitials(emp.FullName)}
                                    </div>
                                    <div class="user-details">
                                        <div class="user-name">${escapeHtml(emp.FullName)}</div>
                                        <div class="user-email">${escapeHtml(emp.Email)}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="role-badge role-${emp.RoleName.toLowerCase().replace(' ', '')}">
                                    ${emp.RoleName}
                                </span>
                            </td>
                            <td>${escapeHtml(emp.Department || '-')}</td>
                            <td>
                                <span class="status-badge status-${emp.IsActive ? 'active' : 'inactive'}">
                                    ${emp.IsActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>${emp.LastLogin ? formatDate(emp.LastLogin) : 'Never'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-sm btn-edit" onclick="editEmployee(${emp.UserID})" title="Edit">
                                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146zM11.207 9l-3-3L2.5 11.707V14.5h2.793L11.207 9z"/>
                                        </svg>
                                    </button>
                                    <button class="btn-sm btn-permissions" onclick="managePermissions(${emp.UserID}, '${escapeHtml(emp.FullName)}')" title="Permissions">
                                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                                        </svg>
                                    </button>
                                    <button class="btn-sm btn-toggle" onclick="toggleEmployeeStatus(${emp.UserID})" title="Toggle Status">
                                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M6 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1zM1.5 5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5h-13z"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Add pagination if needed
        if (filteredEmployees.length > employeesPerPage) {
            html += renderPagination(filteredEmployees.length, currentEmployeePage, employeesPerPage, 'employee');
        }
    }
    
    document.getElementById('employees-content').innerHTML = html;
}

/**
 * Load customers with filters and pagination
 */
async function loadCustomers() {
    const search = document.getElementById('customer-search').value;
    const statusFilter = document.getElementById('customer-status-filter').value;
    
    try {
        showLoading('customers-content');
        
        const params = new URLSearchParams({
            page: currentCustomerPage,
            limit: customersPerPage,
            search: search,
            status: statusFilter
        });
        
        const response = await fetch(`/api/users/customers?${params}`);
        const data = await response.json();
        
        if (data.success) {
            renderCustomers(data.customers, data.pagination);
        } else {
            showError('Failed to load customers');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showError('Error loading customers');
    }
}

/**
 * Render customers table
 */
function renderCustomers(customers, pagination) {
    let html = '';
    
    if (customers.length === 0) {
        html = `
            <div class="empty-state">
                <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                </svg>
                <h3>No customers found</h3>
                <p>No customers match your search criteria.</p>
            </div>
        `;
    } else {
        html = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Verified</th>
                        <th>Registered</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(customer => `
                        <tr>
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">
                                        ${getInitials(customer.FullName)}
                                    </div>
                                    <div class="user-details">
                                        <div class="user-name">${escapeHtml(customer.FullName)}</div>
                                        <div class="user-email">${escapeHtml(customer.Email)}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${escapeHtml(customer.PhoneNumber || '-')}</td>
                            <td>
                                <span class="status-badge status-${customer.IsActive ? 'active' : 'inactive'}">
                                    ${customer.IsActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge status-${customer.IsEmailVerified ? 'active' : 'inactive'}">
                                    ${customer.IsEmailVerified ? 'Verified' : 'Unverified'}
                                </span>
                            </td>
                            <td>${formatDate(customer.CreatedAt)}</td>
                            <td>${customer.LastLogin ? formatDate(customer.LastLogin) : 'Never'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-sm btn-toggle" onclick="toggleCustomerStatus(${customer.CustomerID})" title="Toggle Status">
                                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M6 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1zM1.5 5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5h-13z"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Add pagination
        if (pagination.pages > 1) {
            html += renderCustomerPagination(pagination);
        }
    }
    
    document.getElementById('customers-content').innerHTML = html;
}

/**
 * Load roles overview
 */
async function loadRoles() {
    try {
        showLoading('roles-content');
        
        const response = await fetch('/api/users/roles');
        const data = await response.json();
        
        if (data.success) {
            renderRoles(data.roles);
        } else {
            showError('Failed to load roles');
        }
    } catch (error) {
        console.error('Error loading roles:', error);
        showError('Error loading roles');
    }
}

/**
 * Render roles overview
 */
function renderRoles(roles) {
    const roleDescriptions = {
        'Admin': 'Full system access with all permissions. Can manage everything including user accounts, settings, and system configuration.',
        'TransactionManager': 'Manages financial transactions, payments, and monetary operations. Has access to transaction reports and payment processing.',
        'InventoryManager': 'Manages product inventory, stock levels, and product information. Can add, edit, and organize products.',
        'UserManager': 'Manages customer accounts and user support. Can view customer information and handle account-related issues.',
        'OrderSupport': 'Handles customer orders and order processing. Can view, update, and manage order statuses and customer support.',
        'Employee': 'Basic employee access with limited permissions. Can view products and basic dashboard information.'
    };
    
    const html = `
        <div class="permission-grid">
            ${roles.map(role => `
                <div class="permission-section">
                    <div class="permission-section-header">
                        <span class="role-badge role-${role.RoleName.toLowerCase().replace(' ', '')}">${role.RoleName}</span>
                    </div>
                    <div class="permission-section-body">
                        <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
                            ${roleDescriptions[role.RoleName] || role.Description || 'No description available.'}
                        </p>
                        <div style="display: flex; justify-content: between; align-items: center; padding: 10px 0; border-top: 1px solid #f0f0f0;">
                            <span style="font-weight: 500; color: #333;">Status:</span>
                            <span class="status-badge status-${role.IsActive ? 'active' : 'inactive'}">
                                ${role.IsActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: between; align-items: center; padding: 10px 0;">
                            <span style="font-weight: 500; color: #333;">Created:</span>
                            <span style="color: #666; font-size: 14px;">${formatDate(role.CreatedAt)}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('roles-content').innerHTML = html;
}

/**
 * Employee modal functions
 */
function openCreateEmployeeModal() {
    document.getElementById('employee-modal-title').textContent = 'Create Employee';
    document.getElementById('employee-form').reset();
    document.getElementById('employee-id').value = '';
    document.getElementById('password-group').style.display = 'block';
    document.getElementById('employee-password').required = true;
    document.getElementById('employee-modal').style.display = 'flex';
}

function editEmployee(userId) {
    fetch(`/api/users/employees/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const emp = data.employee;
                document.getElementById('employee-modal-title').textContent = 'Edit Employee';
                document.getElementById('employee-id').value = emp.UserID;
                document.getElementById('employee-username').value = emp.Username;
                document.getElementById('employee-fullname').value = emp.FullName;
                document.getElementById('employee-email').value = emp.Email;
                document.getElementById('employee-phone').value = emp.PhoneNumber || '';
                document.getElementById('employee-role').value = emp.RoleID;
                document.getElementById('employee-department').value = emp.Department || '';
                document.getElementById('employee-status').value = emp.IsActive ? '1' : '0';
                document.getElementById('password-group').style.display = 'none';
                document.getElementById('employee-password').required = false;
                document.getElementById('employee-modal').style.display = 'flex';
            } else {
                showError('Failed to load employee details');
            }
        })
        .catch(error => {
            console.error('Error loading employee:', error);
            showError('Error loading employee details');
        });
}

function closeEmployeeModal() {
    document.getElementById('employee-modal').style.display = 'none';
}

async function saveEmployee() {
    const employeeId = document.getElementById('employee-id').value;
    const isEdit = !!employeeId;
    
    const formData = {
        username: document.getElementById('employee-username').value,
        fullName: document.getElementById('employee-fullname').value,
        email: document.getElementById('employee-email').value,
        phoneNumber: document.getElementById('employee-phone').value,
        roleId: parseInt(document.getElementById('employee-role').value),
        department: document.getElementById('employee-department').value,
        isActive: document.getElementById('employee-status').value === '1'
    };
    
    if (!isEdit) {
        formData.password = document.getElementById('employee-password').value;
    }
    
    try {
        const url = isEdit ? `/api/users/employees/${employeeId}` : '/api/users/employees';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(isEdit ? 'Employee updated successfully!' : 'Employee created successfully!');
            closeEmployeeModal();
            loadEmployees();
        } else {
            showError(data.message || 'Failed to save employee');
        }
    } catch (error) {
        console.error('Error saving employee:', error);
        showError('Error saving employee');
    }
}

/**
 * Permission management
 */
async function managePermissions(userId, userName) {
    currentPermissionsUserId = userId;
    
    try {
        const response = await fetch(`/api/users/permissions/${userId}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('permissions-user-info').innerHTML = `
                <strong>Managing permissions for: ${escapeHtml(userName)}</strong>
                <br><small style="color: #666;">User ID: ${userId}</small>
            `;
            
            renderPermissionsGrid(data.permissions);
            document.getElementById('permissions-modal').style.display = 'flex';
        } else {
            showError('Failed to load permissions');
        }
    } catch (error) {
        console.error('Error loading permissions:', error);
        showError('Error loading permissions');
    }
}

function renderPermissionsGrid(permissions) {
    const sections = [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'products', label: 'Products' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'orders', label: 'Orders' },
        { key: 'customers', label: 'Customers' },
        { key: 'users', label: 'Users' },
        { key: 'transactions', label: 'Transactions' },
        { key: 'reports', label: 'Reports' },
        { key: 'settings', label: 'Settings' },
        { key: 'cms', label: 'Content Management' }
    ];
    
    const html = `
        <div class="permission-grid">
            ${sections.map(section => {
                const sectionPerms = permissions[section.key] || {};
                return `
                    <div class="permission-section">
                        <div class="permission-section-header">${section.label}</div>
                        <div class="permission-section-body">
                            ${['canAccess', 'canCreate', 'canRead', 'canUpdate', 'canDelete'].map(perm => `
                                <div class="permission-item">
                                    <span class="permission-label">${perm.replace('can', '')}</span>
                                    <label class="permission-toggle">
                                        <input type="checkbox" data-section="${section.key}" data-permission="${perm}" ${sectionPerms[perm] ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    document.getElementById('permissions-content').innerHTML = html;
}

function closePermissionsModal() {
    document.getElementById('permissions-modal').style.display = 'none';
    currentPermissionsUserId = null;
}

async function savePermissions() {
    if (!currentPermissionsUserId) return;
    
    const permissions = {};
    const checkboxes = document.querySelectorAll('#permissions-content input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        const section = checkbox.dataset.section;
        const permission = checkbox.dataset.permission;
        
        if (!permissions[section]) {
            permissions[section] = {};
        }
        
        permissions[section][permission] = checkbox.checked;
    });
    
    try {
        const response = await fetch('/api/users/permissions/set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentPermissionsUserId,
                permissions: permissions
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Permissions updated successfully!');
            closePermissionsModal();
        } else {
            showError(data.message || 'Failed to save permissions');
        }
    } catch (error) {
        console.error('Error saving permissions:', error);
        showError('Error saving permissions');
    }
}

/**
 * Status toggle functions
 */
async function toggleEmployeeStatus(userId) {
    if (!confirm('Are you sure you want to toggle this employee\'s status?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/employees/${userId}/toggle-status`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`Employee ${data.isActive ? 'activated' : 'deactivated'} successfully!`);
            loadEmployees();
        } else {
            showError(data.message || 'Failed to update employee status');
        }
    } catch (error) {
        console.error('Error toggling employee status:', error);
        showError('Error updating employee status');
    }
}

async function toggleCustomerStatus(customerId) {
    if (!confirm('Are you sure you want to toggle this customer\'s status?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/customers/${customerId}/toggle-status`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`Customer ${data.isActive ? 'activated' : 'deactivated'} successfully!`);
            loadCustomers();
        } else {
            showError(data.message || 'Failed to update customer status');
        }
    } catch (error) {
        console.error('Error toggling customer status:', error);
        showError('Error updating customer status');
    }
}

/**
 * Pagination functions
 */
function renderPagination(totalItems, currentPage, itemsPerPage, type) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return '';
    
    let html = '<div class="pagination">';
    
    // Previous button
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1}, '${type}')">Previous</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i}, '${type}')">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span>...</span>';
        }
    }
    
    // Next button
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1}, '${type}')">Next</button>`;
    
    html += '</div>';
    return html;
}

function renderCustomerPagination(pagination) {
    const { page, pages } = pagination;
    
    let html = '<div class="pagination">';
    
    // Previous button
    html += `<button ${page === 1 ? 'disabled' : ''} onclick="changeCustomerPage(${page - 1})">Previous</button>`;
    
    // Page numbers
    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
            html += `<button class="${i === page ? 'active' : ''}" onclick="changeCustomerPage(${i})">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += '<span>...</span>';
        }
    }
    
    // Next button
    html += `<button ${page === pages ? 'disabled' : ''} onclick="changeCustomerPage(${page + 1})">Next</button>`;
    
    html += '</div>';
    return html;
}

function changePage(page, type) {
    if (type === 'employee') {
        currentEmployeePage = page;
        loadEmployees();
    }
}

function changeCustomerPage(page) {
    currentCustomerPage = page;
    loadCustomers();
}

/**
 * Utility functions
 */
function showLoading(containerId) {
    document.getElementById(containerId).innerHTML = `
        <div class="loading" style="text-align: center; padding: 40px;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 10px; color: #666;">Loading...</p>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    messageElement.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showWarning(message) {
    showNotification(message, 'warning');
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for spinner animation
if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}
