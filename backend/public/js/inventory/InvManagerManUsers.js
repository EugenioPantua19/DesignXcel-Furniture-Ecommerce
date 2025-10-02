document.addEventListener('DOMContentLoaded', function() {
    fetchEmployeeAccounts();
    fetchCustomerAccounts();

    async function fetchEmployeeAccounts() {
        try {
            const response = await fetch('/Employee/Admin/Users/EmployeesData'); // Still uses Admin endpoint unless you add InventoryManager-specific
            const data = await response.json();

            if (data.success) {
                displayEmployeeAccounts(data.employees);
            } else {
                console.error('Error fetching employee accounts:', data.message);
            }
        } catch (error) {
            console.error('Network or parsing error:', error);
        }
    }

    function displayEmployeeAccounts(employees) {
        const tableBody = document.querySelector('#employeeAccountsTable tbody');
        const noEmployeeAccountsMessage = document.getElementById('noEmployeeAccounts');
        tableBody.innerHTML = '';

        if (employees.length === 0) {
            noEmployeeAccountsMessage.style.display = 'block';
            return;
        }

        noEmployeeAccountsMessage.style.display = 'none';
        employees.forEach(employee => {
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
                    >Edit</button>
                </td>
            `;
        });
    }

    async function fetchCustomerAccounts() {
        try {
            const response = await fetch('/Employee/Admin/Users/CustomersData'); // Still uses Admin endpoint unless you add InventoryManager-specific
            const data = await response.json();

            if (data.success) {
                displayCustomerAccounts(data.customers);
            } else {
                console.error('Error fetching customer accounts:', data.message);
            }
        } catch (error) {
            console.error('Network or parsing error:', error);
        }
    }

    function displayCustomerAccounts(customers) {
        const tableBody = document.querySelector('#customerAccountsTable tbody');
        const noCustomerAccountsMessage = document.getElementById('noCustomerAccounts');
        tableBody.innerHTML = '';

        if (customers.length === 0) {
            noCustomerAccountsMessage.style.display = 'block';
            return;
        }

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
                    <button class="edit-user-btn">Edit</button>
                </td>
            `;
        });
    }

    // Modal logic for editing user
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-user-btn')) {
            const btn = e.target;
            document.getElementById('editUserID').value = btn.getAttribute('data-userid');
            document.getElementById('editUsername').value = btn.getAttribute('data-username');
            document.getElementById('editFullName').value = btn.getAttribute('data-fullname');
            document.getElementById('editEmail').value = btn.getAttribute('data-email');
            document.getElementById('editRole').value = btn.getAttribute('data-roleid');
            document.getElementById('editIsActive').value = btn.getAttribute('data-isactive');
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

    // Show popup if success message is present in a flash message or query param
    if (window.location.search.includes('success=1') || document.body.innerHTML.includes('User updated successfully')) {
        showCustomPopup('User details updated successfully!');
    }
});



