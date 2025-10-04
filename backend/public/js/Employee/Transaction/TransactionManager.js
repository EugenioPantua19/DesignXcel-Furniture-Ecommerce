// Transaction Manager JavaScript
// Handles transaction-specific functionality and permissions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize transaction manager functionality
    initializeTransactionManager();
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize real-time updates
    initializeRealTimeUpdates();
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

function initializeRealTimeUpdates() {
    console.log('Real-time updates initialized');
    
    // Setup WebSocket connection for real-time updates
    if (window.WebSocket) {
        const ws = new WebSocket('ws://localhost:3000/transaction-updates');
        
        ws.onmessage = function(event) {
            const update = JSON.parse(event.data);
            handleRealTimeUpdate(update);
        };
        
        ws.onclose = function() {
            console.log('WebSocket connection closed');
        };
    }
    
    // Setup polling for updates every 30 seconds
    setInterval(() => {
        loadTransactionMetrics();
        loadRecentOrders();
        loadPendingTransactions();
    }, 30000);
}

function handleRealTimeUpdate(update) {
    switch (update.type) {
        case 'new_order':
            addNewOrder(update.data);
            break;
        case 'order_status_change':
            updateOrderStatusInUI(update.data);
            break;
        case 'payment_received':
            handlePaymentReceived(update.data);
            break;
        case 'delivery_update':
            handleDeliveryUpdate(update.data);
            break;
        default:
            console.log('Unknown update type:', update.type);
    }
}

function addNewOrder(order) {
    // Add new order to the recent orders list
    const ordersContainer = document.getElementById('recentOrders');
    if (ordersContainer) {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item new-order';
        orderElement.innerHTML = `
            <div class="order-info">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-customer">${order.customerName}</div>
                <div class="order-status status-${order.status.toLowerCase()}">${order.status}</div>
                <div class="order-amount">$${order.amount}</div>
            </div>
        `;
        
        ordersContainer.insertBefore(orderElement, ordersContainer.firstChild);
        
        // Show notification
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(`New order received: #${order.id}`, 'success');
        }
        
        // Remove the "new-order" class after 5 seconds
        setTimeout(() => {
            orderElement.classList.remove('new-order');
        }, 5000);
    }
}

function updateOrderStatusInUI(orderData) {
    // Update order status in the UI
    const orderElement = document.querySelector(`[data-order-id="${orderData.id}"]`);
    if (orderElement) {
        const statusElement = orderElement.querySelector('.order-status');
        if (statusElement) {
            statusElement.textContent = orderData.status;
            statusElement.className = `order-status status-${orderData.status.toLowerCase()}`;
        }
    }
}

function handlePaymentReceived(paymentData) {
    // Handle payment received notification
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showNotification(`Payment received: $${paymentData.amount}`, 'success');
    }
    
    // Update transaction metrics
    loadTransactionMetrics();
}

function handleDeliveryUpdate(deliveryData) {
    // Handle delivery update
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showNotification(`Delivery update: ${deliveryData.status}`, 'info');
    }
}

// Enhanced order management functions
function loadOrderDetails(orderId) {
    fetch(`/api/transactions/orders/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayOrderDetails(data.order);
            }
        })
        .catch(error => {
            console.error('Error loading order details:', error);
        });
}

function displayOrderDetails(order) {
    // Display order details in a modal or dedicated page
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Order #${order.id}</h3>
                    <span class="close" onclick="closeOrderDetailsModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="order-details">
                        <div class="customer-info">
                            <h4>Customer Information</h4>
                            <p><strong>Name:</strong> ${order.customerName}</p>
                            <p><strong>Email:</strong> ${order.customerEmail}</p>
                            <p><strong>Phone:</strong> ${order.customerPhone}</p>
                        </div>
                        <div class="order-items">
                            <h4>Order Items</h4>
                            ${order.items.map(item => `
                                <div class="order-item">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-quantity">Qty: ${item.quantity}</div>
                                    <div class="item-price">$${item.price}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-summary">
                            <h4>Order Summary</h4>
                            <p><strong>Subtotal:</strong> $${order.subtotal}</p>
                            <p><strong>Tax:</strong> $${order.tax}</p>
                            <p><strong>Shipping:</strong> $${order.shipping}</p>
                            <p><strong>Total:</strong> $${order.total}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-close" onclick="closeOrderDetailsModal()">Close</button>
                    <button class="btn-edit" onclick="editOrder(${order.id})">Edit Order</button>
                </div>
            </div>
        `;
        modal.style.display = 'block';
    }
}

function closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function editOrder(orderId) {
    window.location.href = `/Employee/Transaction/EditOrder/${orderId}`;
}

// Enhanced delivery management
function loadDeliveryRates() {
    fetch('/api/transactions/delivery-rates')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayDeliveryRates(data.rates);
            }
        })
        .catch(error => {
            console.error('Error loading delivery rates:', error);
        });
}

function displayDeliveryRates(rates) {
    const container = document.getElementById('deliveryRatesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    rates.forEach(rate => {
        const rateElement = document.createElement('div');
        rateElement.className = 'delivery-rate-item';
        rateElement.innerHTML = `
            <div class="rate-header">
                <div class="rate-name">${rate.name}</div>
                <div class="rate-price">$${rate.price}</div>
            </div>
            <div class="rate-details">
                <div class="rate-description">${rate.description}</div>
                <div class="rate-delivery-time">${rate.deliveryTime}</div>
            </div>
            <div class="rate-actions">
                <button class="btn-edit-rate" data-rate-id="${rate.id}">Edit</button>
                <button class="btn-delete-rate" data-rate-id="${rate.id}">Delete</button>
            </div>
        `;
        container.appendChild(rateElement);
    });
    
    // Add event listeners
    setupDeliveryRateActions();
}

function setupDeliveryRateActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit-rate')) {
            const rateId = e.target.getAttribute('data-rate-id');
            editDeliveryRate(rateId);
        }
        
        if (e.target.classList.contains('btn-delete-rate')) {
            const rateId = e.target.getAttribute('data-rate-id');
            deleteDeliveryRate(rateId);
        }
    });
}

function editDeliveryRate(rateId) {
    window.location.href = `/Employee/Transaction/EditDeliveryRate/${rateId}`;
}

function deleteDeliveryRate(rateId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to delete this delivery rate?', 'Delete Delivery Rate')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/transactions/delivery-rates/${rateId}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Delivery rate deleted successfully!');
                            loadDeliveryRates(); // Refresh rates list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to delete delivery rate', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting delivery rate:', error);
                        window.EmployeeUtils.showNotification('Error deleting delivery rate', 'error');
                    });
                }
            });
    }
}

// Enhanced walk-in orders management
function loadWalkInOrders() {
    fetch('/api/transactions/walk-in-orders')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayWalkInOrders(data.orders);
            }
        })
        .catch(error => {
            console.error('Error loading walk-in orders:', error);
        });
}

function displayWalkInOrders(orders) {
    const container = document.getElementById('walkInOrdersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'walk-in-order-item';
        orderElement.innerHTML = `
            <div class="order-header">
                <div class="order-id">Walk-in Order #${order.id}</div>
                <div class="order-status status-${order.status}">${order.status}</div>
            </div>
            <div class="order-details">
                <div class="order-customer">Customer: ${order.customerName}</div>
                <div class="order-items">Items: ${order.itemCount}</div>
                <div class="order-total">Total: $${order.total}</div>
                <div class="order-date">Date: ${formatDate(order.createdAt)}</div>
            </div>
            <div class="order-actions">
                <button class="btn-view" data-order-id="${order.id}">View</button>
                <button class="btn-process" data-order-id="${order.id}">Process</button>
                <button class="btn-complete" data-order-id="${order.id}">Complete</button>
            </div>
        `;
        container.appendChild(orderElement);
    });
    
    // Add event listeners
    setupWalkInOrderActions();
}

function setupWalkInOrderActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-view')) {
            const orderId = e.target.getAttribute('data-order-id');
            viewWalkInOrder(orderId);
        }
        
        if (e.target.classList.contains('btn-process')) {
            const orderId = e.target.getAttribute('data-order-id');
            processWalkInOrder(orderId);
        }
        
        if (e.target.classList.contains('btn-complete')) {
            const orderId = e.target.getAttribute('data-order-id');
            completeWalkInOrder(orderId);
        }
    });
}

function viewWalkInOrder(orderId) {
    window.location.href = `/Employee/Transaction/WalkInOrder/${orderId}`;
}

function processWalkInOrder(orderId) {
    fetch(`/api/transactions/walk-in-orders/${orderId}/process`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Walk-in order processed successfully!');
            }
            loadWalkInOrders(); // Refresh orders list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to process walk-in order', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error processing walk-in order:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error processing walk-in order', 'error');
        }
    });
}

function completeWalkInOrder(orderId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to complete this walk-in order?', 'Complete Walk-in Order')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/transactions/walk-in-orders/${orderId}/complete`, {
                        method: 'POST'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Walk-in order completed successfully!');
                            loadWalkInOrders(); // Refresh orders list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to complete walk-in order', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error completing walk-in order:', error);
                        window.EmployeeUtils.showNotification('Error completing walk-in order', 'error');
                    });
                }
            });
    }
}

// Export functions for use in other modules
window.TransactionManager = {
    loadDashboardData,
    loadTransactionMetrics,
    loadRecentOrders,
    loadPendingTransactions,
    updateOrderStatus,
    initializeTransactionManager,
    initializeRealTimeUpdates,
    loadOrderDetails,
    displayOrderDetails,
    loadDeliveryRates,
    displayDeliveryRates,
    loadWalkInOrders,
    displayWalkInOrders,
    processWalkInOrder,
    completeWalkInOrder
};
