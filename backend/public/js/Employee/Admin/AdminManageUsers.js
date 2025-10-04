// public/js/Employee/Admin/AdminManageUsers.js

document.addEventListener('DOMContentLoaded', function() {
    fetchEmployeeAccounts();
    fetchCustomerAccounts();
    
    // Add employee edit form submission handler
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveUserChanges();
        });
    }

    async function fetchEmployeeAccounts() {
        console.log('🔄 Fetching employee accounts...');
        try {
            const response = await fetch('/Employee/Admin/Users/EmployeesData'); // New API endpoint
            console.log('📡 Employee accounts response status:', response.status);
            
            const data = await response.json();
            console.log('📊 Employee accounts data:', data);

            if (data.success) {
                console.log('✅ Employee accounts fetched successfully, count:', data.employees?.length || 0);
                displayEmployeeAccounts(data.employees);
            } else {
                console.error('❌ Error fetching employee accounts:', data.message);
                // Optionally display a general error message on the page
            }
        } catch (error) {
            console.error('❌ Network or parsing error:', error);
            // Optionally display a network error message
        }
    }

    function displayEmployeeAccounts(employees) {
        const tableBody = document.querySelector('#employeeAccountsTable tbody');
        const noEmployeeAccountsMessage = document.getElementById('noEmployeeAccounts');
        tableBody.innerHTML = ''; // Clear existing rows

        // Filter out admin users just in case
        const filteredEmployees = employees.filter(employee => employee.RoleName !== 'Admin');

        if (filteredEmployees.length === 0) {
            noEmployeeAccountsMessage.style.display = 'block';
            return;
        }

        noEmployeeAccountsMessage.style.display = 'none';
        filteredEmployees.forEach(employee => {
            const row = tableBody.insertRow();
            const statusText = employee.IsActive ? 'Active' : 'Inactive';

            row.innerHTML = `
                <td>${employee.UserID}</td>
                <td>${employee.Username}</td>
                <td>${employee.FullName}</td>
                <td>${employee.Email}</td>
                <td>${employee.RoleName}</td>
                <td>${statusText}</td>
                <td>${new Date(employee.CreatedAt).toLocaleDateString()}</td>
                <td>
                    <button class="edit-user-btn"
                        data-userid="${employee.UserID}"
                        data-username="${employee.Username}"
                        data-fullname="${employee.FullName}"
                        data-email="${employee.Email}"
                        data-roleid="${employee.RoleID}"
                        data-isactive="${employee.IsActive ? 1 : 0}"
                        title="Edit"
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 20h9'/><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z'/></svg>
                    </button>
                    <button class="access-btn" onclick="showAccessModal(${employee.UserID})">Access</button>
                    <button class="toggle-user-btn" 
                        data-user-id="${employee.UserID}"
                        data-current-status="${employee.IsActive ? 1 : 0}"
                        style="background-color: ${employee.IsActive ? '#dc3545' : '#28a745'}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em; margin-left: 5px;"
                    >
                        ${employee.IsActive ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            `;
        });
    }

    // Function to handle permission button clicks
    function setPermission(page, permission, userId) {
        console.log(`Setting ${permission} permission for ${page} for user ${userId}`);
        // Here you would typically make an API call to save the permission
        // For now, we'll just show a success message
        alert(`Permission set: ${permission} for ${page} - User ID: ${userId}`);
        
        // Close the dropdown after setting permission
        document.querySelectorAll('.access-dropdown-content').forEach(dd => {
            dd.style.display = 'none';
        });
    }

    async function fetchCustomerAccounts() {
        console.log('🔄 Fetching customer accounts...');
        try {
            const response = await fetch('/Employee/Admin/Users/CustomersData'); // New API endpoint
            console.log('📡 Customer accounts response status:', response.status);
            
            const data = await response.json();
            console.log('📊 Customer accounts data:', data);

            if (data.success) {
                console.log('✅ Customer accounts fetched successfully, count:', data.customers?.length || 0);
                displayCustomerAccounts(data.customers);
            } else {
                console.error('❌ Error fetching customer accounts:', data.message);
                // Optionally display a general error message on the page
            }
        } catch (error) {
            console.error('❌ Network or parsing error:', error);
            // Optionally display a network error message
        }
    }

    function displayCustomerAccounts(customers) {
        console.log('🎨 Displaying customer accounts:', customers);
        const tableBody = document.querySelector('#customerAccountsTable tbody');
        const noCustomerAccountsMessage = document.getElementById('noCustomerAccounts');
        
        console.log('📋 Table body element:', tableBody);
        console.log('📋 No customers message element:', noCustomerAccountsMessage);
        
        tableBody.innerHTML = ''; // Clear existing rows

        if (!customers || customers.length === 0) {
            console.log('📝 No customers to display, showing message');
            noCustomerAccountsMessage.style.display = 'block';
            return;
        }

        console.log(`📝 Displaying ${customers.length} customers`);
        noCustomerAccountsMessage.style.display = 'none';
        customers.forEach(customer => {
            const row = tableBody.insertRow();
            const statusText = customer.IsActive ? 'Active' : 'Inactive';

            row.innerHTML = `
                <td>${customer.CustomerID}</td>
                <td>${customer.FullName}</td>
                <td>${customer.Email}</td>
                <td>${customer.PhoneNumber || 'N/A'}</td>
                <td>${statusText}</td>
                <td>${new Date(customer.CreatedAt).toLocaleDateString()}</td>
                <td>
                    <button class="edit-user-btn"
                        data-customerid="${customer.CustomerID}"
                        data-fullname="${customer.FullName}"
                        data-email="${customer.Email}"
                        data-phonenumber="${customer.PhoneNumber || ''}"
                        data-isactive="${customer.IsActive ? 1 : 0}"
                        title="Edit Customer"
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 20h9'/><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z'/></svg>
                    </button>
                    <button class="toggle-customer-btn" 
                        data-customer-id="${customer.CustomerID}"
                        data-current-status="${customer.IsActive ? 1 : 0}"
                        style="background-color: ${customer.IsActive ? '#dc3545' : '#28a745'}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em; margin-left: 5px;"
                    >
                        ${customer.IsActive ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            `;
        });
    }

    // Modal logic for editing user
    // Use event delegation for dynamically loaded buttons

    document.addEventListener('click', function(e) {
        // Handle toggle customer status buttons
        if (e.target.classList.contains('toggle-customer-btn')) {
            const btn = e.target;
            const customerId = btn.getAttribute('data-customer-id');
            const currentStatus = parseInt(btn.getAttribute('data-current-status'));
            const newStatus = currentStatus ? 0 : 1;
            
            console.log('🔄 Toggling customer status:', { customerId, currentStatus, newStatus });
            toggleCustomerStatus(customerId, newStatus);
            return;
        }
        
        // Handle toggle user status buttons
        if (e.target.classList.contains('toggle-user-btn')) {
            const btn = e.target;
            const userId = btn.getAttribute('data-user-id');
            const currentStatus = parseInt(btn.getAttribute('data-current-status'));
            const newStatus = currentStatus ? 0 : 1;
            
            console.log('🔄 Toggling user status:', { userId, currentStatus, newStatus });
            toggleUserStatus(userId, newStatus);
            return;
        }
        
        
        if (e.target.classList.contains('edit-user-btn')) {
            const btn = e.target;
            
            // Check if it's a customer or user
            const customerId = btn.getAttribute('data-customerid');
            if (customerId) {
                // Handle customer edit
                console.log('✏️ Editing customer:', customerId);
                editCustomer(btn);
                return;
            }
            
            // Handle user edit
            document.getElementById('editUserID').value = btn.getAttribute('data-userid');
            document.getElementById('editUsername').value = btn.getAttribute('data-username');
            document.getElementById('editFullName').value = btn.getAttribute('data-fullname');
            document.getElementById('editEmail').value = btn.getAttribute('data-email');
            // Set the role dropdown to the user's current role
            const roleSelect = document.getElementById('editRole');
            const roleId = btn.getAttribute('data-roleid');
            if (roleSelect) {
                roleSelect.value = roleId;
            }
            document.getElementById('editIsActive').value = btn.getAttribute('data-isactive');
            // Hide or disable role dropdown if admin
            const roleName = btn.closest('tr').querySelector('td:nth-child(5)').textContent.trim();
            if (roleName === 'Admin') {
                roleSelect.value = '5';
                roleSelect.disabled = true;
                roleSelect.style.display = 'none';
                if (!document.getElementById('adminRoleStatic')) {
                    const staticInput = document.createElement('input');
                    staticInput.type = 'text';
                    staticInput.id = 'adminRoleStatic';
                    staticInput.value = 'Admin';
                    staticInput.readOnly = true;
                    staticInput.style.background = '#eee';
                    staticInput.style.marginBottom = '12px';
                    roleSelect.parentNode.insertBefore(staticInput, roleSelect);
                }
            } else {
                roleSelect.disabled = false;
                roleSelect.style.display = '';
                const staticInput = document.getElementById('adminRoleStatic');
                if (staticInput) staticInput.remove();
            }
            document.getElementById('editUserModal').style.display = 'block';
        }
    });

    document.getElementById('closeEditUserModal').onclick = function() {
        document.getElementById('editUserModal').style.display = 'none';
    };
    document.getElementById('cancelEditUser').onclick = function() {
        document.getElementById('editUserModal').style.display = 'none';
    };
    window.onclick = function(event) {
        if (event.target == document.getElementById('editUserModal')) {
            document.getElementById('editUserModal').style.display = 'none';
        }
    };

    // Show popup if success message is present in a flash message or query param
    if (window.location.search.includes('success=1') || document.body.innerHTML.includes('User updated successfully')) {
        showCustomPopup('User details updated successfully!');
    }
});

function showCustomPopup(message) {
    const popup = document.getElementById('customPopup');
    const popupMessage = popup.querySelector('.custom-popup-message');
    const popupIcon = popup.querySelector('.custom-popup-icon');
    popupMessage.textContent = message;
    popupIcon.textContent = '✓';
    popup.className = 'custom-popup';
    popup.style.display = 'block';
    setTimeout(() => {
        popup.classList.add('hide');
        setTimeout(() => {
            popup.style.display = 'none';
            popup.classList.remove('hide');
        }, 500);
    }, 3000);
}

// Toggle user status function
function toggleUserStatus(userId, newStatus) {
    console.log('🎯 toggleUserStatus called with:', { userId, newStatus });
    
    if (confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user?`)) {
        console.log('✅ User confirmed, making API request...');
        
        fetch(`/Employee/Admin/ManageUsers/ToggleActive/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            console.log('📡 API response status:', response.status);
            if (response.ok) {
                console.log('✅ User status updated successfully');
                showCustomPopup(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                console.error('❌ API request failed with status:', response.status);
                alert('Failed to update user status');
            }
        })
        .catch(error => {
            console.error('❌ Network error:', error);
            alert('An error occurred while updating user status');
        });
    } else {
        console.log('❌ User cancelled the operation');
    }
}


// Edit customer function
function editCustomer(btn) {
    const customerId = btn.getAttribute('data-customerid');
    const fullName = btn.getAttribute('data-fullname');
    const email = btn.getAttribute('data-email');
    const phoneNumber = btn.getAttribute('data-phonenumber');
    const isActive = btn.getAttribute('data-isactive');
    
    console.log('🎯 editCustomer called with:', { customerId, fullName, email, phoneNumber, isActive });
    
    // Check if customer edit modal exists, if not create it
    let customerEditModal = document.getElementById('customerEditModal');
    if (!customerEditModal) {
        createCustomerEditModal();
        customerEditModal = document.getElementById('customerEditModal');
    }
    
    // Populate the modal with customer data
    document.getElementById('editCustomerID').value = customerId;
    document.getElementById('editCustomerFullName').value = fullName;
    document.getElementById('editCustomerEmail').value = email;
    document.getElementById('editCustomerPhoneNumber').value = phoneNumber || '';
    document.getElementById('editCustomerIsActive').value = isActive;
    
    // Show the modal
    customerEditModal.style.display = 'block';
}

// Create customer edit modal
function createCustomerEditModal() {
    const modalHTML = `
        <div id="customerEditModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Customer</h2>
                    <span class="close" onclick="closeCustomerEditModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="customerEditForm">
                        <input type="hidden" id="editCustomerID" name="customerId">
                        
                        <div class="form-group">
                            <label for="editCustomerFullName">Full Name:</label>
                            <input type="text" id="editCustomerFullName" name="fullName" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editCustomerEmail">Email:</label>
                            <input type="email" id="editCustomerEmail" name="email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editCustomerPhoneNumber">Phone Number:</label>
                            <input type="tel" id="editCustomerPhoneNumber" name="phoneNumber">
                        </div>
                        
                        <div class="form-group">
                            <label for="editCustomerIsActive">Status:</label>
                            <select id="editCustomerIsActive" name="isActive">
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" onclick="closeCustomerEditModal()" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submission handler
    document.getElementById('customerEditForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCustomerChanges();
    });
}

// Save customer changes
function saveCustomerChanges() {
    const customerId = document.getElementById('editCustomerID');
    const fullName = document.getElementById('editCustomerFullName');
    const email = document.getElementById('editCustomerEmail');
    const phoneNumber = document.getElementById('editCustomerPhoneNumber');
    const isActive = document.getElementById('editCustomerIsActive');
    
    // Check if form elements exist
    if (!customerId || !fullName || !email || !isActive) {
        console.error('❌ Customer edit form elements not found:', {
            customerId: !!customerId,
            fullName: !!fullName,
            email: !!email,
            phoneNumber: !!phoneNumber,
            isActive: !!isActive
        });
        alert('Form elements not found. Please try refreshing the page.');
        return;
    }
    
    const customerIdValue = customerId.value;
    const fullNameValue = fullName.value;
    const emailValue = email.value;
    const phoneNumberValue = phoneNumber ? phoneNumber.value : '';
    const isActiveValue = isActive.value;
    
    console.log('💾 Saving customer changes:', { 
        customerId: customerIdValue, 
        fullName: fullNameValue, 
        email: emailValue, 
        phoneNumber: phoneNumberValue, 
        isActive: isActiveValue 
    });
    
    // Validate required fields
    if (!customerIdValue || !fullNameValue || !emailValue) {
        alert('Please fill in all required fields (Full Name and Email)');
        return;
    }
    
    fetch(`/Employee/Admin/Customers/Update/${customerIdValue}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fullName: fullNameValue,
            email: emailValue,
            phoneNumber: phoneNumberValue,
            isActive: isActiveValue === '1'
        })
    })
    .then(response => {
        console.log('📡 API response status:', response.status);
        console.log('📡 API response headers:', response.headers);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('📡 Response content type:', contentType);
        
        if (response.ok) {
            return response.json();
        } else {
            // Try to get error message from response
            return response.text().then(text => {
                console.error('❌ API error response:', text);
                try {
                    const errorData = JSON.parse(text);
                    if (errorData.error) {
                        throw new Error(`Server error: ${errorData.error}`);
                    } else {
                        throw new Error(`Server responded with ${response.status}: ${text}`);
                    }
                } catch (parseError) {
                    throw new Error(`Server responded with ${response.status}: ${text}`);
                }
            });
        }
    })
    .then(data => {
        console.log('✅ Customer updated successfully:', data);
        showCustomPopup('Customer updated successfully!');
        closeCustomerEditModal();
        setTimeout(() => {
            location.reload();
        }, 1500);
    })
    .catch(error => {
        console.error('❌ Error updating customer:', error);
        
        // Show more detailed error message
        let errorMessage = 'An error occurred while updating customer';
        if (error.message.includes('Server responded with')) {
            errorMessage = error.message;
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
        }
        
        alert(errorMessage);
    });
}

// Close customer edit modal
function closeCustomerEditModal() {
    const modal = document.getElementById('customerEditModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save user changes
function saveUserChanges() {
    const userId = document.getElementById('editUserID').value;
    const username = document.getElementById('editUsername').value;
    const fullName = document.getElementById('editFullName').value;
    const email = document.getElementById('editEmail').value;
    const roleId = document.getElementById('editRole').value;
    const isActive = document.getElementById('editIsActive').value;
    
    console.log('💾 Saving user changes:', { userId, username, fullName, email, roleId, isActive });
    
    fetch(`/Employee/Admin/ManageUsers/Update/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            fullName,
            email,
            roleId: parseInt(roleId),
            isActive: isActive === '1'
        })
    })
    .then(response => {
        console.log('📡 API response status:', response.status);
        if (response.ok) {
            console.log('✅ User updated successfully');
            showCustomPopup('User updated successfully!');
            closeEditUserModal();
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            console.error('❌ API request failed with status:', response.status);
            alert('Failed to update user');
        }
    })
    .catch(error => {
        console.error('❌ Network error:', error);
        alert('An error occurred while updating user');
    });
}

// Close user edit modal
function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Toggle customer status function
function toggleCustomerStatus(customerId, newStatus) {
    console.log('🎯 toggleCustomerStatus called with:', { customerId, newStatus });
    
    if (confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this customer?`)) {
        console.log('✅ User confirmed, making API request...');
        
        fetch(`/Employee/Admin/Customers/ToggleActive/${customerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            console.log('📡 API response status:', response.status);
            if (response.ok) {
                console.log('✅ Customer status updated successfully');
                showCustomPopup(`Customer ${newStatus ? 'activated' : 'deactivated'} successfully!`);
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                console.error('❌ API request failed with status:', response.status);
                alert('Failed to update customer status');
            }
        })
        .catch(error => {
            console.error('❌ Network error:', error);
            alert('An error occurred while updating customer status');
        });
    } else {
        console.log('❌ User cancelled the operation');
    }
} 