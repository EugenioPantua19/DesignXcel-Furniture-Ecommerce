// Employee JavaScript Index
// Main entry point for all Employee JavaScript modules

// Load shared utilities first
import './shared/EmployeeUtils.js';
import './shared/PermissionsHandler.js';

// Load Admin modules
import './Admin/AdminLogs.js';
import './Admin/AdminAlerts.js';
import './Admin/AdminCMS.js';
import './Admin/AdminManageUsers.js';

// Load Inventory modules
import './Inventory/InventoryManager.js';
import './Inventory/InvManagerAlerts.js';
import './Inventory/InventoryProducts.js';
import './Inventory/InvManagerMaterials.js';
import './Inventory/InvManagerProducts.js';

// Load Support modules
import './Support/OrderSupport.js';
import './Support/SupportManager.js';

// Load Transaction modules
import './Transaction/TransactionManager.js';

// Load UserManager modules
import './UserManager/UserManager.js';

// Initialize Employee system
document.addEventListener('DOMContentLoaded', function() {
    console.log('Employee JavaScript modules loaded');
    
    // Initialize shared utilities
    if (window.EmployeeUtils) {
        console.log('EmployeeUtils initialized');
    }
    
    if (window.userPermissions) {
        console.log('PermissionsHandler initialized');
    }
    
    // Setup global error handling
    setupGlobalErrorHandling();
    
    // Setup global notifications
    setupGlobalNotifications();
    
    // Setup global loading states
    setupGlobalLoadingStates();
});

function setupGlobalErrorHandling() {
    // Global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(
                'An unexpected error occurred. Please try again.',
                'error',
                5000
            );
        }
    });
    
    // Global error handler for JavaScript errors
    window.addEventListener('error', function(event) {
        console.error('JavaScript error:', event.error);
        
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(
                'A system error occurred. Please refresh the page.',
                'error',
                5000
            );
        }
    });
}

function setupGlobalNotifications() {
    // Setup notification styles
    const style = document.createElement('style');
    style.textContent = `
        .employee-notification {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
        }
        
        .employee-notification.notification-success {
            background: #10b981;
            color: white;
        }
        
        .employee-notification.notification-error {
            background: #ef4444;
            color: white;
        }
        
        .employee-notification.notification-warning {
            background: #f59e0b;
            color: white;
        }
        
        .employee-notification.notification-info {
            background: #3b82f6;
            color: white;
        }
        
        .new-order {
            animation: highlight 2s ease-in-out;
        }
        
        @keyframes highlight {
            0% { background-color: #10b981; }
            100% { background-color: transparent; }
        }
        
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: #666;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

function setupGlobalLoadingStates() {
    // Setup global loading indicators
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'globalLoadingOverlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    loadingOverlay.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">Loading...</div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

// Global utility functions
window.EmployeeSystem = {
    // Show global loading
    showGlobalLoading: function(text = 'Loading...') {
        const overlay = document.getElementById('globalLoadingOverlay');
        if (overlay) {
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = text;
            }
            overlay.style.display = 'flex';
        }
    },
    
    // Hide global loading
    hideGlobalLoading: function() {
        const overlay = document.getElementById('globalLoadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },
    
    // Format currency
    formatCurrency: function(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    // Format date
    formatDate: function(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },
    
    // Format time
    formatTime: function(date, options = {}) {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleTimeString('en-US', { ...defaultOptions, ...options });
    },
    
    // Format file size
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Validate email
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate phone number
    validatePhone: function(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },
    
    // Generate random ID
    generateId: function(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Copy to clipboard
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Copied to clipboard!');
                }
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Copied to clipboard!');
            }
        }
    },
    
    // Download file
    downloadFile: function(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    // Print element
    printElement: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print</title>
                        <style>
                            body { font-family: Arial, sans-serif; }
                            @media print { body { margin: 0; } }
                        </style>
                    </head>
                    <body>
                        ${element.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EmployeeUtils: window.EmployeeUtils,
        userPermissions: window.userPermissions,
        EmployeeSystem: window.EmployeeSystem
    };
}
