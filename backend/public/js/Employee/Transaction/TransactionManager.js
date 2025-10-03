// Transaction Manager JavaScript
// Handles transaction-specific functionality and permissions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize transaction manager functionality
    initializeTransactionManager();
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeTransactionManager() {
    console.log('Initializing Transaction Manager...');
    
    // Wait for userPermissions to be initialized
    if (window.userPermissions) {
        // Check if user has transaction permissions
        if (!window.userPermissions.hasPermission('transactions')) {
            console.log('User does not have transaction permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        
        // Update UI based on permissions
        window.userPermissions.updateUI();
    } else {
        // Fallback: wait a bit and try again
        setTimeout(initializeTransactionManager, 100);
        return;
    }
    
    // Initialize transaction-specific features
    initializeOrderManagement();
    initializeDeliveryRates();
    initializeWalkInOrders();
}

function loadDashboardData() {
    // Load transaction metrics
    loadTransactionMetrics();
    
    // Load recent orders
    loadRecentOrders();
    
    // Load pending transactions
    loadPendingTransactions();
}

function loadTransactionMetrics() {
    fetch('/api/transactions/metrics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateTransactionMetrics(data.metrics);
            }
        })
        .catch(error => {
            console.error('Error loading transaction metrics:', error);
        });
}

function updateTransactionMetrics(metrics) {
    // Update total orders
    const totalOrders = document.getElementById('totalOrders');
    if (totalOrders) {
        totalOrders.textContent = metrics.totalOrders || 0;
    }
    
    // Update pending orders
    const pendingOrders = document.getElementById('pendingOrders');
    if (pendingOrders) {
        pendingOrders.textContent = metrics.pendingOrders || 0;
    }
    
    // Update completed orders
    const completedOrders = document.getElementById('completedOrders');
    if (completedOrders) {
        completedOrders.textContent = metrics.completedOrders || 0;
    }
    
    // Update revenue
    const revenue = document.getElementById('revenue');
    if (revenue) {
        revenue.textContent = `$${metrics.revenue || 0}`;
    }
}

function loadRecentOrders() {
    fetch('/api/transactions/orders/recent')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayRecentOrders(data.orders);
            }
        })
        .catch(error => {
            console.error('Error loading recent orders:', error);
        });
}

function displayRecentOrders(orders) {
    const ordersContainer = document.getElementById('recentOrders');
    if (!ordersContainer) return;
    
    ordersContainer.innerHTML = '';
    
    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        orderElement.innerHTML = `
            <div class="order-info">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-customer">${order.customerName}</div>
                <div class="order-status status-${order.status.toLowerCase()}">${order.status}</div>
                <div class="order-amount">$${order.amount}</div>
            </div>
        `;
        ordersContainer.appendChild(orderElement);
    });
}

function loadPendingTransactions() {
    fetch('/api/transactions/pending')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPendingTransactions(data.transactions);
            }
        })
        .catch(error => {
            console.error('Error loading pending transactions:', error);
        });
}

function displayPendingTransactions(transactions) {
    const transactionsContainer = document.getElementById('pendingTransactions');
    if (!transactionsContainer) return;
    
    transactionsContainer.innerHTML = '';
    
    transactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        transactionElement.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-type">${transaction.type}</div>
                <div class="transaction-amount">$${transaction.amount}</div>
                <div class="transaction-status">${transaction.status}</div>
            </div>
        `;
        transactionsContainer.appendChild(transactionElement);
    });
}

function initializeOrderManagement() {
    // Initialize order management features
    console.log('Order management initialized');
    
    // Setup order status updates
    setupOrderStatusUpdates();
}

function setupOrderStatusUpdates() {
    // Handle order status changes
    const statusButtons = document.querySelectorAll('[data-order-status]');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            const newStatus = this.getAttribute('data-order-status');
            updateOrderStatus(orderId, newStatus);
        });
    });
}

function updateOrderStatus(orderId, newStatus) {
    if (confirm(`Are you sure you want to change this order status to ${newStatus}?`)) {
        fetch(`/api/transactions/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Order status updated successfully!');
                // Refresh the page or update the UI
                location.reload();
            } else {
                showNotification('Failed to update order status', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating order status:', error);
            showNotification('Error updating order status', 'error');
        });
    }
}

function initializeDeliveryRates() {
    // Initialize delivery rates management
    console.log('Delivery rates management initialized');
}

function initializeWalkInOrders() {
    // Initialize walk-in orders management
    console.log('Walk-in orders management initialized');
}

function setupEventListeners() {
    // Setup logout functionality
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Setup navigation
    setupNavigation();
    
    // Setup form submissions
    setupFormSubmissions();
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

function setupFormSubmissions() {
    // Handle form submissions
    const forms = document.querySelectorAll('form[data-transaction]');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(this);
        });
    });
}

function handleFormSubmission(form) {
    const formData = new FormData(form);
    const action = form.getAttribute('action');
    const method = form.getAttribute('method') || 'POST';
    
    fetch(action, {
        method: method,
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Operation completed successfully!');
            // Refresh or redirect as needed
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                location.reload();
            }
        } else {
            showNotification(data.message || 'Operation failed', 'error');
        }
    })
    .catch(error => {
        console.error('Form submission error:', error);
        showNotification('An error occurred', 'error');
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
window.TransactionManager = {
    loadDashboardData,
    loadTransactionMetrics,
    loadRecentOrders,
    loadPendingTransactions,
    updateOrderStatus,
    initializeTransactionManager
};
