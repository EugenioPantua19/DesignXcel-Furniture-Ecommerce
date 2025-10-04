// Support Manager JavaScript
// Handles customer support and chat management functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize support manager functionality
    initializeSupportManager();
    
    // Load support data
    loadSupportData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeSupportManager() {
    console.log('Initializing Support Manager...');
    
    // Wait for userPermissions to be initialized
    if (window.userPermissions) {
        // Check if user has support permissions
        if (!window.userPermissions.hasPermission('chat')) {
            console.log('User does not have support permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        
        // Update UI based on permissions
        window.userPermissions.updateUI();
    } else {
        // Fallback: wait a bit and try again
        setTimeout(initializeSupportManager, 100);
        return;
    }
    
    // Initialize support-specific features
    initializeChatSupport();
    initializeTicketManagement();
    initializeCustomerSupport();
    initializeSupportAnalytics();
}

function loadSupportData() {
    // Load active chats
    loadActiveChats();
    
    // Load support tickets
    loadSupportTickets();
    
    // Load customer information
    loadCustomerInformation();
    
    // Load support metrics
    loadSupportMetrics();
}

function loadActiveChats() {
    fetch('/api/support/chats/active')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayActiveChats(data.chats);
            }
        })
        .catch(error => {
            console.error('Error loading active chats:', error);
        });
}

function displayActiveChats(chats) {
    const container = document.getElementById('activeChatsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    chats.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.className = 'chat-item';
        chatElement.innerHTML = `
            <div class="chat-header">
                <div class="chat-customer">
                    <div class="customer-avatar">
                        <img src="${chat.customerAvatar || '/images/default-avatar.png'}" alt="${chat.customerName}" style="width: 40px; height: 40px; border-radius: 50%;">
                    </div>
                    <div class="customer-info">
                        <div class="customer-name">${chat.customerName}</div>
                        <div class="customer-email">${chat.customerEmail}</div>
                    </div>
                </div>
                <div class="chat-status status-${chat.status}">${chat.status}</div>
            </div>
            <div class="chat-details">
                <div class="chat-duration">Duration: ${chat.duration}</div>
                <div class="chat-waiting">Waiting: ${chat.waitingTime}</div>
                <div class="chat-priority priority-${chat.priority}">${chat.priority}</div>
            </div>
            <div class="chat-message">
                <div class="last-message">${chat.lastMessage}</div>
                <div class="message-time">${formatTime(chat.lastMessageTime)}</div>
            </div>
            <div class="chat-actions">
                <button class="btn-join" data-chat-id="${chat.id}">Join Chat</button>
                <button class="btn-transfer" data-chat-id="${chat.id}">Transfer</button>
                <button class="btn-close" data-chat-id="${chat.id}">Close</button>
            </div>
        `;
        container.appendChild(chatElement);
    });
    
    // Add event listeners
    setupChatActions();
}

function loadSupportTickets() {
    fetch('/api/support/tickets')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySupportTickets(data.tickets);
            }
        })
        .catch(error => {
            console.error('Error loading support tickets:', error);
        });
}

function displaySupportTickets(tickets) {
    const container = document.getElementById('supportTicketsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    tickets.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-item';
        ticketElement.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-id">Ticket #${ticket.id}</div>
                <div class="ticket-status status-${ticket.status}">${ticket.status}</div>
            </div>
            <div class="ticket-subject">${ticket.subject}</div>
            <div class="ticket-customer">
                <div class="customer-name">${ticket.customerName}</div>
                <div class="customer-email">${ticket.customerEmail}</div>
            </div>
            <div class="ticket-details">
                <div class="ticket-priority priority-${ticket.priority}">${ticket.priority}</div>
                <div class="ticket-category">${ticket.category}</div>
                <div class="ticket-created">Created: ${formatDate(ticket.createdAt)}</div>
            </div>
            <div class="ticket-actions">
                <button class="btn-view" data-ticket-id="${ticket.id}">View</button>
                <button class="btn-assign" data-ticket-id="${ticket.id}">Assign</button>
                <button class="btn-resolve" data-ticket-id="${ticket.id}">Resolve</button>
            </div>
        `;
        container.appendChild(ticketElement);
    });
    
    // Add event listeners
    setupTicketActions();
}

function loadCustomerInformation() {
    fetch('/api/support/customers')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayCustomerInformation(data.customers);
            }
        })
        .catch(error => {
            console.error('Error loading customer information:', error);
        });
}

function displayCustomerInformation(customers) {
    const container = document.getElementById('customersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    customers.forEach(customer => {
        const customerElement = document.createElement('div');
        customerElement.className = 'customer-item';
        customerElement.innerHTML = `
            <div class="customer-header">
                <div class="customer-avatar">
                    <img src="${customer.avatar || '/images/default-avatar.png'}" alt="${customer.name}" style="width: 50px; height: 50px; border-radius: 50%;">
                </div>
                <div class="customer-info">
                    <div class="customer-name">${customer.name}</div>
                    <div class="customer-email">${customer.email}</div>
                </div>
                <div class="customer-status status-${customer.status}">${customer.status}</div>
            </div>
            <div class="customer-details">
                <div class="customer-phone">${customer.phone || 'No phone'}</div>
                <div class="customer-joined">Joined: ${formatDate(customer.joinedAt)}</div>
                <div class="customer-orders">Orders: ${customer.orderCount}</div>
            </div>
            <div class="customer-support">
                <div class="support-tickets">Tickets: ${customer.ticketCount}</div>
                <div class="support-chats">Chats: ${customer.chatCount}</div>
                <div class="support-rating">Rating: ${customer.rating || 'N/A'}</div>
            </div>
            <div class="customer-actions">
                <button class="btn-view-customer" data-customer-id="${customer.id}">View Profile</button>
                <button class="btn-chat-customer" data-customer-id="${customer.id}">Start Chat</button>
                <button class="btn-ticket-customer" data-customer-id="${customer.id}">Create Ticket</button>
            </div>
        `;
        container.appendChild(customerElement);
    });
    
    // Add event listeners
    setupCustomerActions();
}

function loadSupportMetrics() {
    fetch('/api/support/metrics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySupportMetrics(data.metrics);
            }
        })
        .catch(error => {
            console.error('Error loading support metrics:', error);
        });
}

function displaySupportMetrics(metrics) {
    // Update metrics cards
    updateMetricCard('activeChats', metrics.activeChats);
    updateMetricCard('pendingTickets', metrics.pendingTickets);
    updateMetricCard('resolvedToday', metrics.resolvedToday);
    updateMetricCard('avgResponseTime', metrics.avgResponseTime);
    
    // Update charts
    updateSupportCharts(metrics);
}

function updateMetricCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        card.textContent = value || 0;
    }
}

function updateSupportCharts(metrics) {
    // Update ticket status chart
    updateTicketStatusChart(metrics.ticketStatus);
    
    // Update response time chart
    updateResponseTimeChart(metrics.responseTime);
    
    // Update customer satisfaction chart
    updateCustomerSatisfactionChart(metrics.customerSatisfaction);
}

function updateTicketStatusChart(ticketStatus) {
    const chartContainer = document.getElementById('ticketStatusChart');
    if (!chartContainer || !ticketStatus) return;
    
    chartContainer.innerHTML = '';
    
    Object.entries(ticketStatus).forEach(([status, count]) => {
        const statusElement = document.createElement('div');
        statusElement.className = 'status-item';
        statusElement.innerHTML = `
            <div class="status-name">${status}</div>
            <div class="status-bar" style="width: ${(count / Math.max(...Object.values(ticketStatus))) * 100}%"></div>
            <div class="status-count">${count}</div>
        `;
        chartContainer.appendChild(statusElement);
    });
}

function updateResponseTimeChart(responseTime) {
    const chartContainer = document.getElementById('responseTimeChart');
    if (!chartContainer || !responseTime) return;
    
    chartContainer.innerHTML = '';
    
    const maxTime = Math.max(...responseTime.map(day => day.time));
    
    responseTime.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'response-time-item';
        dayElement.innerHTML = `
            <div class="day-name">${day.day}</div>
            <div class="time-bar" style="height: ${(day.time / maxTime) * 100}%"></div>
            <div class="time-value">${day.time}min</div>
        `;
        chartContainer.appendChild(dayElement);
    });
}

function updateCustomerSatisfactionChart(satisfaction) {
    const chartContainer = document.getElementById('customerSatisfactionChart');
    if (!chartContainer || !satisfaction) return;
    
    chartContainer.innerHTML = '';
    
    Object.entries(satisfaction).forEach(([rating, count]) => {
        const ratingElement = document.createElement('div');
        ratingElement.className = 'satisfaction-item';
        ratingElement.innerHTML = `
            <div class="rating-name">${rating} stars</div>
            <div class="rating-bar" style="width: ${(count / Math.max(...Object.values(satisfaction))) * 100}%"></div>
            <div class="rating-count">${count}</div>
        `;
        chartContainer.appendChild(ratingElement);
    });
}

function initializeChatSupport() {
    console.log('Chat support initialized');
    
    // Setup real-time chat updates
    setupChatUpdates();
    
    // Setup chat notifications
    setupChatNotifications();
}

function setupChatUpdates() {
    // Update active chats every 10 seconds
    setInterval(() => {
        loadActiveChats();
    }, 10000);
}

function setupChatNotifications() {
    // Setup browser notifications for new chats
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

function initializeTicketManagement() {
    console.log('Ticket management initialized');
    
    // Setup ticket creation
    setupTicketCreation();
    
    // Setup ticket assignment
    setupTicketAssignment();
}

function setupTicketCreation() {
    const createTicketForm = document.getElementById('createTicketForm');
    if (createTicketForm) {
        createTicketForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateTicket(this);
        });
    }
}

function handleCreateTicket(form) {
    const formData = new FormData(form);
    const ticketData = Object.fromEntries(formData);
    
    // Validate form data
    if (!ticketData.subject || ticketData.subject.trim() === '') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Subject is required', 'error');
        }
        return;
    }
    
    if (!ticketData.description || ticketData.description.trim() === '') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Description is required', 'error');
        }
        return;
    }
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showLoading('createTicketStatus', 'Creating ticket...');
    }
    
    fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Ticket created successfully!');
            }
            form.reset();
            loadSupportTickets(); // Refresh tickets list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to create ticket: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error creating ticket:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error creating ticket', 'error');
        }
    })
    .finally(() => {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.hideLoading('createTicketStatus');
        }
    });
}

function setupTicketAssignment() {
    // Setup ticket assignment functionality
    console.log('Ticket assignment setup completed');
}

function initializeCustomerSupport() {
    console.log('Customer support initialized');
    
    // Setup customer search
    setupCustomerSearch();
    
    // Setup customer communication
    setupCustomerCommunication();
}

function setupCustomerSearch() {
    const searchInput = document.getElementById('customerSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchCustomers(this.value);
        });
    }
}

function searchCustomers(searchTerm) {
    const customerItems = document.querySelectorAll('.customer-item');
    
    customerItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function setupCustomerCommunication() {
    // Setup customer communication functionality
    console.log('Customer communication setup completed');
}

function initializeSupportAnalytics() {
    console.log('Support analytics initialized');
    
    // Setup analytics dashboard
    setupAnalyticsDashboard();
}

function setupAnalyticsDashboard() {
    // Setup analytics dashboard functionality
    console.log('Analytics dashboard setup completed');
}

function setupEventListeners() {
    // Setup chat actions
    setupChatActions();
    
    // Setup ticket actions
    setupTicketActions();
    
    // Setup customer actions
    setupCustomerActions();
    
    // Setup support search
    setupSupportSearch();
}

function setupChatActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-join')) {
            const chatId = e.target.getAttribute('data-chat-id');
            joinChat(chatId);
        }
        
        if (e.target.classList.contains('btn-transfer')) {
            const chatId = e.target.getAttribute('data-chat-id');
            transferChat(chatId);
        }
        
        if (e.target.classList.contains('btn-close')) {
            const chatId = e.target.getAttribute('data-chat-id');
            closeChat(chatId);
        }
    });
}

function setupTicketActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-view')) {
            const ticketId = e.target.getAttribute('data-ticket-id');
            viewTicket(ticketId);
        }
        
        if (e.target.classList.contains('btn-assign')) {
            const ticketId = e.target.getAttribute('data-ticket-id');
            assignTicket(ticketId);
        }
        
        if (e.target.classList.contains('btn-resolve')) {
            const ticketId = e.target.getAttribute('data-ticket-id');
            resolveTicket(ticketId);
        }
    });
}

function setupCustomerActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-view-customer')) {
            const customerId = e.target.getAttribute('data-customer-id');
            viewCustomer(customerId);
        }
        
        if (e.target.classList.contains('btn-chat-customer')) {
            const customerId = e.target.getAttribute('data-customer-id');
            startChatWithCustomer(customerId);
        }
        
        if (e.target.classList.contains('btn-ticket-customer')) {
            const customerId = e.target.getAttribute('data-customer-id');
            createTicketForCustomer(customerId);
        }
    });
}

function setupSupportSearch() {
    // Setup search functionality
    setupSearchFilters();
}

function setupSearchFilters() {
    // Filter by status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterByStatus(this.value);
        });
    }
    
    // Filter by priority
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) {
        priorityFilter.addEventListener('change', function() {
            filterByPriority(this.value);
        });
    }
}

function filterByStatus(status) {
    const items = document.querySelectorAll('.chat-item, .ticket-item');
    
    items.forEach(item => {
        const statusElement = item.querySelector('.status');
        if (statusElement) {
            const itemStatus = statusElement.textContent.toLowerCase();
            if (status === 'all' || itemStatus.includes(status.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        }
    });
}

function filterByPriority(priority) {
    const items = document.querySelectorAll('.chat-item, .ticket-item');
    
    items.forEach(item => {
        const priorityElement = item.querySelector('.priority');
        if (priorityElement) {
            const itemPriority = priorityElement.textContent.toLowerCase();
            if (priority === 'all' || itemPriority.includes(priority.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        }
    });
}

// Action functions
function joinChat(chatId) {
    window.location.href = `/Employee/Support/Chat/${chatId}`;
}

function transferChat(chatId) {
    const newAgent = prompt('Enter the username of the agent to transfer to:');
    if (newAgent) {
        fetch(`/api/support/chats/${chatId}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newAgent })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Chat transferred successfully!');
                }
                loadActiveChats(); // Refresh chats list
            } else {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Failed to transfer chat', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error transferring chat:', error);
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Error transferring chat', 'error');
            }
        });
    }
}

function closeChat(chatId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to close this chat?', 'Close Chat')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/support/chats/${chatId}/close`, {
                        method: 'POST'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Chat closed successfully!');
                            loadActiveChats(); // Refresh chats list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to close chat', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error closing chat:', error);
                        window.EmployeeUtils.showNotification('Error closing chat', 'error');
                    });
                }
            });
    }
}

function viewTicket(ticketId) {
    window.location.href = `/Employee/Support/Ticket/${ticketId}`;
}

function assignTicket(ticketId) {
    const assignee = prompt('Enter the username of the agent to assign to:');
    if (assignee) {
        fetch(`/api/support/tickets/${ticketId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assignee })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Ticket assigned successfully!');
                }
                loadSupportTickets(); // Refresh tickets list
            } else {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Failed to assign ticket', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error assigning ticket:', error);
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Error assigning ticket', 'error');
            }
        });
    }
}

function resolveTicket(ticketId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to resolve this ticket?', 'Resolve Ticket')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/support/tickets/${ticketId}/resolve`, {
                        method: 'POST'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Ticket resolved successfully!');
                            loadSupportTickets(); // Refresh tickets list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to resolve ticket', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error resolving ticket:', error);
                        window.EmployeeUtils.showNotification('Error resolving ticket', 'error');
                    });
                }
            });
    }
}

function viewCustomer(customerId) {
    window.location.href = `/Employee/Support/Customer/${customerId}`;
}

function startChatWithCustomer(customerId) {
    window.location.href = `/Employee/Support/StartChat/${customerId}`;
}

function createTicketForCustomer(customerId) {
    window.location.href = `/Employee/Support/CreateTicket/${customerId}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions for use in other modules
window.SupportManager = {
    loadSupportData,
    loadActiveChats,
    loadSupportTickets,
    loadCustomerInformation,
    loadSupportMetrics,
    joinChat,
    transferChat,
    closeChat,
    viewTicket,
    assignTicket,
    resolveTicket,
    viewCustomer,
    startChatWithCustomer,
    createTicketForCustomer,
    initializeSupportManager
};
