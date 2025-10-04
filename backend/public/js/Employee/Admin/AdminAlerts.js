// Admin Alerts JavaScript
// Handles system alerts and notifications for admin users

document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin alerts functionality
    initializeAdminAlerts();
    
    // Load alerts data
    loadAlertsData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeAdminAlerts() {
    console.log('Initializing Admin Alerts...');
    
    // Wait for userPermissions to be initialized
    if (window.userPermissions) {
        // Check if user has admin permissions
        if (!window.userPermissions.hasPermission('admin')) {
            console.log('User does not have admin permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        
        // Update UI based on permissions
        window.userPermissions.updateUI();
    } else {
        // Fallback: wait a bit and try again
        setTimeout(initializeAdminAlerts, 100);
        return;
    }
    
    // Initialize alert-specific features
    initializeSystemAlerts();
    initializeSecurityAlerts();
    initializePerformanceAlerts();
}

function loadAlertsData() {
    // Load system alerts
    loadSystemAlerts();
    
    // Load security alerts
    loadSecurityAlerts();
    
    // Load performance alerts
    loadPerformanceAlerts();
    
    // Load user activity alerts
    loadUserActivityAlerts();
}

function loadSystemAlerts() {
    fetch('/api/admin/alerts/system')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySystemAlerts(data.alerts);
            }
        })
        .catch(error => {
            console.error('Error loading system alerts:', error);
        });
}

function displaySystemAlerts(alerts) {
    const alertsContainer = document.getElementById('systemAlertsList');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item alert-${alert.severity}`;
        alertElement.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-severity severity-${alert.severity}">${alert.severity.toUpperCase()}</div>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-meta">
                <span class="alert-timestamp">${formatTimestamp(alert.timestamp)}</span>
                <span class="alert-source">${alert.source}</span>
            </div>
            <div class="alert-actions">
                <button class="btn-dismiss" data-alert-id="${alert.id}">Dismiss</button>
                <button class="btn-acknowledge" data-alert-id="${alert.id}">Acknowledge</button>
            </div>
        `;
        alertsContainer.appendChild(alertElement);
    });
    
    // Add event listeners to alert buttons
    setupAlertActions();
}

function loadSecurityAlerts() {
    fetch('/api/admin/alerts/security')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySecurityAlerts(data.alerts);
            }
        })
        .catch(error => {
            console.error('Error loading security alerts:', error);
        });
}

function displaySecurityAlerts(alerts) {
    const alertsContainer = document.getElementById('securityAlertsList');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `security-alert-item alert-${alert.severity}`;
        alertElement.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-severity severity-${alert.severity}">${alert.severity.toUpperCase()}</div>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-details">
                <div class="alert-ip">IP: ${alert.ipAddress}</div>
                <div class="alert-user">User: ${alert.userName || 'Unknown'}</div>
                <div class="alert-timestamp">${formatTimestamp(alert.timestamp)}</div>
            </div>
            <div class="alert-actions">
                <button class="btn-block-ip" data-ip="${alert.ipAddress}">Block IP</button>
                <button class="btn-investigate" data-alert-id="${alert.id}">Investigate</button>
            </div>
        `;
        alertsContainer.appendChild(alertElement);
    });
    
    // Add event listeners to security alert buttons
    setupSecurityAlertActions();
}

function loadPerformanceAlerts() {
    fetch('/api/admin/alerts/performance')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPerformanceAlerts(data.alerts);
            }
        })
        .catch(error => {
            console.error('Error loading performance alerts:', error);
        });
}

function displayPerformanceAlerts(alerts) {
    const alertsContainer = document.getElementById('performanceAlertsList');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `performance-alert-item alert-${alert.severity}`;
        alertElement.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-metric">${alert.metric}: ${alert.value}</div>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-chart" id="chart-${alert.id}"></div>
            <div class="alert-actions">
                <button class="btn-optimize" data-alert-id="${alert.id}">Optimize</button>
                <button class="btn-monitor" data-alert-id="${alert.id}">Monitor</button>
            </div>
        `;
        alertsContainer.appendChild(alertElement);
    });
    
    // Add event listeners to performance alert buttons
    setupPerformanceAlertActions();
}

function loadUserActivityAlerts() {
    fetch('/api/admin/alerts/user-activity')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayUserActivityAlerts(data.alerts);
            }
        })
        .catch(error => {
            console.error('Error loading user activity alerts:', error);
        });
}

function displayUserActivityAlerts(alerts) {
    const alertsContainer = document.getElementById('userActivityAlertsList');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `user-activity-alert-item alert-${alert.severity}`;
        alertElement.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-user">User: ${alert.userName}</div>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-details">
                <div class="alert-activity">Activity: ${alert.activity}</div>
                <div class="alert-timestamp">${formatTimestamp(alert.timestamp)}</div>
            </div>
            <div class="alert-actions">
                <button class="btn-view-user" data-user-id="${alert.userId}">View User</button>
                <button class="btn-suspend-user" data-user-id="${alert.userId}">Suspend User</button>
            </div>
        `;
        alertsContainer.appendChild(alertElement);
    });
    
    // Add event listeners to user activity alert buttons
    setupUserActivityAlertActions();
}

function initializeSystemAlerts() {
    console.log('System alerts initialized');
    
    // Setup real-time updates
    setupSystemAlertUpdates();
}

function initializeSecurityAlerts() {
    console.log('Security alerts initialized');
    
    // Setup security monitoring
    setupSecurityMonitoring();
}

function initializePerformanceAlerts() {
    console.log('Performance alerts initialized');
    
    // Setup performance monitoring
    setupPerformanceMonitoring();
}

function setupSystemAlertUpdates() {
    // Update system alerts every 30 seconds
    setInterval(() => {
        loadSystemAlerts();
    }, 30000);
}

function setupSecurityMonitoring() {
    // Monitor for security events
    setInterval(() => {
        loadSecurityAlerts();
    }, 15000);
}

function setupPerformanceMonitoring() {
    // Monitor system performance
    setInterval(() => {
        loadPerformanceAlerts();
    }, 60000);
}

function setupEventListeners() {
    // Setup alert filtering
    setupAlertFiltering();
    
    // Setup alert actions
    setupAlertActions();
    
    // Setup real-time updates
    setupRealTimeUpdates();
}

function setupAlertFiltering() {
    // Filter by severity
    const severityFilter = document.getElementById('severityFilter');
    if (severityFilter) {
        severityFilter.addEventListener('change', function() {
            filterAlertsBySeverity(this.value);
        });
    }
    
    // Filter by type
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            filterAlertsByType(this.value);
        });
    }
    
    // Search alerts
    const searchInput = document.getElementById('alertSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchAlerts(this.value);
        });
    }
}

function filterAlertsBySeverity(severity) {
    const alertItems = document.querySelectorAll('.alert-item, .security-alert-item, .performance-alert-item, .user-activity-alert-item');
    
    alertItems.forEach(item => {
        if (severity === 'all' || item.classList.contains(`alert-${severity}`)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterAlertsByType(type) {
    const containers = {
        'system': document.getElementById('systemAlertsList'),
        'security': document.getElementById('securityAlertsList'),
        'performance': document.getElementById('performanceAlertsList'),
        'user-activity': document.getElementById('userActivityAlertsList')
    };
    
    Object.entries(containers).forEach(([containerType, container]) => {
        if (container) {
            if (type === 'all' || containerType === type) {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        }
    });
}

function searchAlerts(searchTerm) {
    const alertItems = document.querySelectorAll('.alert-item, .security-alert-item, .performance-alert-item, .user-activity-alert-item');
    
    alertItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function setupAlertActions() {
    // Dismiss alert
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-dismiss')) {
            const alertId = e.target.getAttribute('data-alert-id');
            dismissAlert(alertId);
        }
    });
    
    // Acknowledge alert
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-acknowledge')) {
            const alertId = e.target.getAttribute('data-alert-id');
            acknowledgeAlert(alertId);
        }
    });
}

function setupSecurityAlertActions() {
    // Block IP
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-block-ip')) {
            const ip = e.target.getAttribute('data-ip');
            blockIP(ip);
        }
    });
    
    // Investigate alert
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-investigate')) {
            const alertId = e.target.getAttribute('data-alert-id');
            investigateAlert(alertId);
        }
    });
}

function setupPerformanceAlertActions() {
    // Optimize system
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-optimize')) {
            const alertId = e.target.getAttribute('data-alert-id');
            optimizeSystem(alertId);
        }
    });
    
    // Monitor performance
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-monitor')) {
            const alertId = e.target.getAttribute('data-alert-id');
            monitorPerformance(alertId);
        }
    });
}

function setupUserActivityAlertActions() {
    // View user
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-view-user')) {
            const userId = e.target.getAttribute('data-user-id');
            viewUser(userId);
        }
    });
    
    // Suspend user
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-suspend-user')) {
            const userId = e.target.getAttribute('data-user-id');
            suspendUser(userId);
        }
    });
}

function setupRealTimeUpdates() {
    // Setup WebSocket connection for real-time alerts
    if (window.WebSocket) {
        const ws = new WebSocket('ws://localhost:3000/admin-alerts');
        
        ws.onmessage = function(event) {
            const alert = JSON.parse(event.data);
            addNewAlert(alert);
        };
        
        ws.onclose = function() {
            console.log('WebSocket connection closed');
        };
    }
}

// Alert action functions
function dismissAlert(alertId) {
    fetch(`/api/admin/alerts/${alertId}/dismiss`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Alert dismissed successfully!');
            }
            // Remove alert from UI
            const alertElement = document.querySelector(`[data-alert-id="${alertId}"]`);
            if (alertElement) {
                alertElement.remove();
            }
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to dismiss alert', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error dismissing alert:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error dismissing alert', 'error');
        }
    });
}

function acknowledgeAlert(alertId) {
    fetch(`/api/admin/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Alert acknowledged!');
            }
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to acknowledge alert', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error acknowledging alert:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error acknowledging alert', 'error');
        }
    });
}

function blockIP(ip) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm(`Are you sure you want to block IP address ${ip}?`, 'Block IP Address')
            .then(confirmed => {
                if (confirmed) {
                    fetch('/api/admin/security/block-ip', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ ip })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification(`IP address ${ip} blocked successfully!`);
                        } else {
                            window.EmployeeUtils.showNotification('Failed to block IP address', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error blocking IP:', error);
                        window.EmployeeUtils.showNotification('Error blocking IP address', 'error');
                    });
                }
            });
    }
}

function investigateAlert(alertId) {
    window.location.href = `/Employee/Admin/SecurityInvestigation?alertId=${alertId}`;
}

function optimizeSystem(alertId) {
    fetch(`/api/admin/performance/optimize/${alertId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('System optimization started!');
            }
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to start optimization', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error optimizing system:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error optimizing system', 'error');
        }
    });
}

function monitorPerformance(alertId) {
    window.location.href = `/Employee/Admin/PerformanceMonitor?alertId=${alertId}`;
}

function viewUser(userId) {
    window.location.href = `/Employee/UserManager/ViewUser?id=${userId}`;
}

function suspendUser(userId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to suspend this user?', 'Suspend User')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/admin/users/${userId}/suspend`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('User suspended successfully!');
                        } else {
                            window.EmployeeUtils.showNotification('Failed to suspend user', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error suspending user:', error);
                        window.EmployeeUtils.showNotification('Error suspending user', 'error');
                    });
                }
            });
    }
}

function addNewAlert(alert) {
    // Add new alert to the appropriate container
    const container = document.getElementById(`${alert.type}AlertsList`);
    if (container) {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item alert-${alert.severity}`;
        alertElement.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-severity severity-${alert.severity}">${alert.severity.toUpperCase()}</div>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-meta">
                <span class="alert-timestamp">${formatTimestamp(alert.timestamp)}</span>
                <span class="alert-source">${alert.source}</span>
            </div>
        `;
        
        container.insertBefore(alertElement, container.firstChild);
        
        // Show notification
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(`New ${alert.severity} alert: ${alert.title}`, alert.severity);
        }
    }
}

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Export functions for use in other modules
window.AdminAlerts = {
    loadAlertsData,
    loadSystemAlerts,
    loadSecurityAlerts,
    loadPerformanceAlerts,
    loadUserActivityAlerts,
    dismissAlert,
    acknowledgeAlert,
    blockIP,
    investigateAlert,
    optimizeSystem,
    monitorPerformance,
    viewUser,
    suspendUser,
    initializeAdminAlerts
};