// Employee Shared Utilities
// Common functions and utilities used across all Employee modules

class EmployeeUtils {
    constructor() {
        this.apiBase = '/api';
        this.employeeBase = '/Employee';
        this.notifications = [];
    }

    // Admin-only system - no permission checking needed

    // API request utilities
    async apiRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(endpoint, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            this.showNotification(`Request failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Notification system
    showNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `employee-notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'};
            color: ${type === 'warning' ? '#000' : 'white'};
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            max-width: 400px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;

        // Add animation keyframes
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    // Loading state management
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = `
                <div class="loading-container" style="text-align: center; padding: 20px;">
                    <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                    <div class="loading-text">${text}</div>
                </div>
            `;
        }
    }

    hideLoading(element, originalContent = '') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = originalContent;
        }
    }

    // Form utilities
    serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    validateForm(form, rules = {}) {
        const errors = [];
        const formData = this.serializeForm(form);
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            
            if (rule.required && (!value || value.trim() === '')) {
                errors.push(`${rule.label || field} is required`);
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors.push(`${rule.label || field} must be at least ${rule.minLength} characters`);
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${rule.label || field} must be no more than ${rule.maxLength} characters`);
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${rule.label || field} format is invalid`);
            }
        }
        
        return { isValid: errors.length === 0, errors };
    }

    // Date utilities
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Table utilities
    createTable(data, columns, options = {}) {
        const table = document.createElement('table');
        table.className = options.className || 'data-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.header;
            th.style.cssText = column.headerStyle || '';
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.className = options.rowClass ? options.rowClass(row, index) : '';
            
            columns.forEach(column => {
                const td = document.createElement('td');
                const value = column.accessor ? column.accessor(row) : row[column.key];
                td.innerHTML = column.render ? column.render(value, row, index) : value;
                td.style.cssText = column.cellStyle || '';
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return table;
    }

    // Search and filter utilities
    filterData(data, searchTerm, searchFields = []) {
        if (!searchTerm) return data;
        
        const term = searchTerm.toLowerCase();
        return data.filter(item => {
            if (searchFields.length === 0) {
                // Search all string values
                return Object.values(item).some(value => 
                    typeof value === 'string' && value.toLowerCase().includes(term)
                );
            } else {
                // Search specific fields
                return searchFields.some(field => {
                    const value = this.getNestedValue(item, field);
                    return typeof value === 'string' && value.toLowerCase().includes(term);
                });
            }
        });
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Modal utilities
    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            
            if (options.onShow) {
                options.onShow(modal);
            }
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    // Confirmation dialog
    confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirmation-modal';
            modal.innerHTML = `
                <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div class="modal-content" style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; margin: 20px;">
                        <h3 style="margin-top: 0;">${title}</h3>
                        <p>${message}</p>
                        <div style="text-align: right; margin-top: 20px;">
                            <button class="btn-cancel" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button class="btn-confirm" style="padding: 8px 16px; border: none; background: #dc3545; color: white; border-radius: 4px; cursor: pointer;">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.btn-cancel').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
            
            modal.querySelector('.btn-confirm').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };
            
            modal.querySelector('.modal-overlay').onclick = (e) => {
                if (e.target === e.currentTarget) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            };
        });
    }

    // Local storage utilities
    setStorage(key, value) {
        try {
            localStorage.setItem(`employee_${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`employee_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    // Debounce utility
    debounce(func, wait) {
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

    // Throttle utility
    throttle(func, limit) {
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
    }
}

// Initialize global instance
window.EmployeeUtils = new EmployeeUtils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmployeeUtils;
}
