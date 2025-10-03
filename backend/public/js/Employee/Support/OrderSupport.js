// Order Support JavaScript
// Handles support-specific functionality and permissions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize order support functionality
    initializeOrderSupport();
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeOrderSupport() {
    console.log('Initializing Order Support...');
    
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
        setTimeout(initializeOrderSupport, 100);
        return;
    }
    
    // Initialize support-specific features
    initializeChatSupport();
    initializeOrderTracking();
    initializeCustomerSupport();
}

function loadDashboardData() {
    // Load support metrics
    loadSupportMetrics();
    
    // Load active chats
    loadActiveChats();
    
    // Load pending support tickets
    loadPendingTickets();
}

function loadSupportMetrics() {
    fetch('/api/support/metrics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSupportMetrics(data.metrics);
            }
        })
        .catch(error => {
            console.error('Error loading support metrics:', error);
        });
}

function updateSupportMetrics(metrics) {
    // Update active chats
    const activeChats = document.getElementById('activeChats');
    if (activeChats) {
        activeChats.textContent = metrics.activeChats || 0;
    }
    
    // Update pending tickets
    const pendingTickets = document.getElementById('pendingTickets');
    if (pendingTickets) {
        pendingTickets.textContent = metrics.pendingTickets || 0;
    }
    
    // Update resolved today
    const resolvedToday = document.getElementById('resolvedToday');
    if (resolvedToday) {
        resolvedToday.textContent = metrics.resolvedToday || 0;
    }
    
    // Update response time
    const avgResponseTime = document.getElementById('avgResponseTime');
    if (avgResponseTime) {
        avgResponseTime.textContent = `${metrics.avgResponseTime || 0} min`;
    }
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
    const chatsContainer = document.getElementById('activeChatsList');
    if (!chatsContainer) return;
    
    chatsContainer.innerHTML = '';
    
    chats.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.className = 'chat-item';
        chatElement.innerHTML = `
            <div class="chat-info">
                <div class="chat-customer">${chat.customerName}</div>
                <div class="chat-status status-${chat.status.toLowerCase()}">${chat.status}</div>
                <div class="chat-duration">${chat.duration}</div>
                <button class="join-chat-btn" data-chat-id="${chat.id}">Join Chat</button>
            </div>
        `;
        chatsContainer.appendChild(chatElement);
    });
    
    // Add event listeners to join chat buttons
    const joinButtons = chatsContainer.querySelectorAll('.join-chat-btn');
    joinButtons.forEach(button => {
        button.addEventListener('click', function() {
            const chatId = this.getAttribute('data-chat-id');
            joinChat(chatId);
        });
    });
}

function loadPendingTickets() {
    fetch('/api/support/tickets/pending')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPendingTickets(data.tickets);
            }
        })
        .catch(error => {
            console.error('Error loading pending tickets:', error);
        });
}

function displayPendingTickets(tickets) {
    const ticketsContainer = document.getElementById('pendingTicketsList');
    if (!ticketsContainer) return;
    
    ticketsContainer.innerHTML = '';
    
    tickets.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-item';
        ticketElement.innerHTML = `
            <div class="ticket-info">
                <div class="ticket-id">Ticket #${ticket.id}</div>
                <div class="ticket-subject">${ticket.subject}</div>
                <div class="ticket-priority priority-${ticket.priority.toLowerCase()}">${ticket.priority}</div>
                <div class="ticket-created">${ticket.createdAt}</div>
                <button class="view-ticket-btn" data-ticket-id="${ticket.id}">View Ticket</button>
            </div>
        `;
        ticketsContainer.appendChild(ticketElement);
    });
    
    // Add event listeners to view ticket buttons
    const viewButtons = ticketsContainer.querySelectorAll('.view-ticket-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const ticketId = this.getAttribute('data-ticket-id');
            viewTicket(ticketId);
        });
    });
}

function initializeChatSupport() {
    // Initialize chat support features
    console.log('Chat support initialized');
    
    // Setup real-time chat updates
    setupChatUpdates();
}

function setupChatUpdates() {
    // Setup WebSocket or polling for real-time updates
    setInterval(() => {
        loadActiveChats();
        loadPendingTickets();
    }, 30000); // Update every 30 seconds
}

function joinChat(chatId) {
    // Open chat window or redirect to chat page
    window.open(`/Employee/Support/ChatSupport?chatId=${chatId}`, '_blank');
}

function viewTicket(ticketId) {
    // Open ticket details or redirect to ticket page
    window.location.href = `/Employee/Support/TicketDetails?id=${ticketId}`;
}

function initializeOrderTracking() {
    // Initialize order tracking features
    console.log('Order tracking initialized');
}

function initializeCustomerSupport() {
    // Initialize customer support features
    console.log('Customer support initialized');
}

function setupEventListeners() {
    // Setup logout functionality
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Setup navigation
    setupNavigation();
    
    // Setup chat functionality
    setupChatFunctionality();
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

function setupChatFunctionality() {
    // Setup chat-related event listeners
    const chatButtons = document.querySelectorAll('[data-chat-action]');
    chatButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-chat-action');
            const chatId = this.getAttribute('data-chat-id');
            handleChatAction(action, chatId);
        });
    });
}

function handleChatAction(action, chatId) {
    switch (action) {
        case 'join':
            joinChat(chatId);
            break;
        case 'close':
            closeChat(chatId);
            break;
        case 'transfer':
            transferChat(chatId);
            break;
        default:
            console.log('Unknown chat action:', action);
    }
}

function closeChat(chatId) {
    if (confirm('Are you sure you want to close this chat?')) {
        fetch(`/api/support/chats/${chatId}/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Chat closed successfully!');
                loadActiveChats(); // Refresh the list
            } else {
                showNotification('Failed to close chat', 'error');
            }
        })
        .catch(error => {
            console.error('Error closing chat:', error);
            showNotification('Error closing chat', 'error');
        });
    }
}

function transferChat(chatId) {
    // Implement chat transfer functionality
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
                showNotification('Chat transferred successfully!');
                loadActiveChats(); // Refresh the list
            } else {
                showNotification('Failed to transfer chat', 'error');
            }
        })
        .catch(error => {
            console.error('Error transferring chat:', error);
            showNotification('Error transferring chat', 'error');
        });
    }
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
window.OrderSupport = {
    loadDashboardData,
    loadSupportMetrics,
    loadActiveChats,
    loadPendingTickets,
    joinChat,
    viewTicket,
    closeChat,
    transferChat,
    initializeOrderSupport
};
