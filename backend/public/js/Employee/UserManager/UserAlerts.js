// User Manager Alerts JavaScript
// Handles user alerts for products and raw materials

document.addEventListener('DOMContentLoaded', function() {
    // Initialize user manager alerts functionality
    initializeUserAlerts();
    
    // Load alerts data
    loadAlertsData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeUserAlerts() {
    console.log('Initializing User Manager Alerts...');
    
    // User Manager system - no permission checking needed
    
    // Initialize user alert features
    initializeUserAlertFeatures();
    
    // Check for critical alerts on page load
    checkCriticalAlerts();
}

function loadAlertsData() {
    // Load product alerts
    loadProductAlerts();
    
    // Load raw material alerts
    loadRawMaterialAlerts();
}

function loadProductAlerts() {
    fetch('/Employee/UserManager/Alerts/Data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayProductAlerts(data.products);
            }
        })
        .catch(error => {
            console.error('Error loading product alerts:', error);
        });
}

function displayProductAlerts(products) {
    const tableBody = document.getElementById('lowStockProductsTable').querySelector('tbody');
    const noProductsMsg = document.getElementById('noLowStockProducts');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        noProductsMsg.style.display = 'block';
        return;
    }
    
    noProductsMsg.style.display = 'none';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        const status = getStockStatus(product.StockQuantity);
        
        row.innerHTML = `
            <td>${product.ProductID}</td>
            <td>${product.Name}</td>
            <td>${product.StockQuantity}</td>
            <td><span class="${status.class}">${status.label}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

function loadRawMaterialAlerts() {
    fetch('/Employee/UserManager/Alerts/Data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayRawMaterialAlerts(data.rawMaterials);
            }
        })
        .catch(error => {
            console.error('Error loading raw material alerts:', error);
        });
}

function displayRawMaterialAlerts(rawMaterials) {
    const tableBody = document.getElementById('lowStockMaterialsTable').querySelector('tbody');
    const noMaterialsMsg = document.getElementById('noLowStockMaterials');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (rawMaterials.length === 0) {
        noMaterialsMsg.style.display = 'block';
        return;
    }
    
    noMaterialsMsg.style.display = 'none';
    
    rawMaterials.forEach(material => {
        const row = document.createElement('tr');
        const status = getStockStatus(material.QuantityAvailable);
        
        row.innerHTML = `
            <td>${material.MaterialID}</td>
            <td>${material.Name}</td>
            <td>${material.QuantityAvailable}</td>
            <td>${material.Unit}</td>
            <td><span class="${status.class}">${status.label}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

function initializeUserAlertFeatures() {
    console.log('User alert features initialized');
    
    // Setup real-time updates for user alerts
    setupUserAlertUpdates();
}

function setupUserAlertUpdates() {
    // Update user alerts every 30 seconds
    setInterval(() => {
        loadProductAlerts();
        loadRawMaterialAlerts();
        checkCriticalAlerts();
    }, 30000);
}

function getStockStatus(quantity) {
    const safetyStock = parseInt(document.getElementById('safetyStockInput')?.value || 10);
    
    if (quantity === 0) {
        return { class: 'out-of-stock', label: 'Out of Stock' };
    } else if (quantity <= safetyStock) {
        return { class: 'critical-stock', label: 'Critical Stock' };
    } else if (quantity <= safetyStock * 2) {
        return { class: 'low-stock', label: 'Low Stock' };
    } else {
        return { class: 'normal-stock', label: 'Normal Stock' };
    }
}

// Utility function to format timestamps
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

function setupEventListeners() {
    // Setup refresh functionality
    setupRefreshButton();
    
    // Setup safety stock form
    setupSafetyStockForm();
}

function setupRefreshButton() {
    // Add refresh functionality if needed
    const refreshBtn = document.getElementById('refreshAlerts');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadAlertsData();
        });
    }
}

function setupSafetyStockForm() {
    // Safety stock form is handled in the EJS template
    // This function can be used for additional form handling if needed
}

// Check for critical alerts and show popup
function checkCriticalAlerts() {
    fetch('/Employee/UserManager/Alerts/Data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const criticalItems = [];
                const safetyStock = parseInt(document.getElementById('safetyStockInput')?.value || 10);
                
                // Check products
                if (data.products && data.products.length > 0) {
                    data.products.forEach(product => {
                        if (product.StockQuantity === 0) {
                            criticalItems.push({
                                type: 'product',
                                name: product.Name,
                                id: product.ProductID,
                                quantity: product.StockQuantity,
                                status: 'out-of-stock'
                            });
                        } else if (product.StockQuantity <= safetyStock) {
                            criticalItems.push({
                                type: 'product',
                                name: product.Name,
                                id: product.ProductID,
                                quantity: product.StockQuantity,
                                status: 'critical'
                            });
                        }
                    });
                }
                
                // Check raw materials
                if (data.rawMaterials && data.rawMaterials.length > 0) {
                    data.rawMaterials.forEach(material => {
                        if (material.QuantityAvailable === 0) {
                            criticalItems.push({
                                type: 'raw material',
                                name: material.Name,
                                id: material.MaterialID,
                                quantity: material.QuantityAvailable,
                                status: 'out-of-stock'
                            });
                        } else if (material.QuantityAvailable <= safetyStock) {
                            criticalItems.push({
                                type: 'raw material',
                                name: material.Name,
                                id: material.MaterialID,
                                quantity: material.QuantityAvailable,
                                status: 'critical'
                            });
                        }
                    });
                }
                
                // Show popup if there are critical items
                if (criticalItems.length > 0) {
                    showCriticalAlertPopup(criticalItems, safetyStock);
                }
            }
        })
        .catch(error => {
            console.error('Error checking critical alerts:', error);
        });
}

// Show critical alert popup
function showCriticalAlertPopup(criticalItems, safetyStock) {
    // Don't show popup if it's already visible
    if (document.getElementById('criticalAlertModal') && 
        document.getElementById('criticalAlertModal').style.display !== 'none') {
        return;
    }
    
    const outOfStockItems = criticalItems.filter(item => item.status === 'out-of-stock');
    const criticalStockItems = criticalItems.filter(item => item.status === 'critical');
    
    let alertMessage = '';
    let alertType = 'warning';
    
    if (outOfStockItems.length > 0) {
        alertMessage = `Critical Alert: ${outOfStockItems.length} item(s) are out of stock!`;
        alertType = 'critical';
    } else if (criticalStockItems.length > 0) {
        alertMessage = `Warning: ${criticalStockItems.length} item(s) are at or below safety stock (${safetyStock})!`;
        alertType = 'warning';
    }
    
    // Create or update the popup modal
    let modal = document.getElementById('criticalAlertModal');
    if (!modal) {
        modal = createCriticalAlertModal();
    }
    
    // Update modal content
    const modalIcon = modal.querySelector('.modal-icon');
    const modalMessage = modal.querySelector('.modal-message');
    const modalDetails = modal.querySelector('.modal-details');
    
    if (alertType === 'critical') {
        modalIcon.innerHTML = '&#9888;';
        modalIcon.style.color = '#dc3545';
        modalMessage.style.color = '#dc3545';
    } else {
        modalIcon.innerHTML = '&#9888;';
        modalIcon.style.color = '#ff9800';
        modalMessage.style.color = '#ff9800';
    }
    
    modalMessage.textContent = alertMessage;
    
    // Hide details section - only show general warning
    modalDetails.style.display = 'none';
    
    // Show modal
    modal.style.display = 'flex';
    
    // Auto-hide after 10 seconds if not critical
    if (alertType !== 'critical') {
        setTimeout(() => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        }, 10000);
    }
}

// Create critical alert modal
function createCriticalAlertModal() {
    const modal = document.createElement('div');
    modal.id = 'criticalAlertModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        z-index: 4000;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: #fff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90vw;
            position: relative;
            text-align: center;
            animation: slideIn 0.3s ease;
        ">
            <span class="close-modal" style="
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 1.8em;
                color: #888;
                cursor: pointer;
                transition: color 0.2s;
            ">&times;</span>
            
            <div class="modal-icon" style="
                font-size: 3em;
                margin-bottom: 15px;
            ">&#9888;</div>
            
            <div class="modal-message" style="
                font-size: 1.3em;
                font-weight: 600;
                margin-bottom: 20px;
                line-height: 1.4;
            "></div>
            
            <div class="modal-details" style="
                font-size: 1em;
                color: #555;
                margin-bottom: 25px;
            "></div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="viewAlertsBtn" style="
                    background: #ff9800;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    padding: 12px 24px;
                    font-size: 1em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                ">View Alerts</button>
                <button id="dismissAlertBtn" style="
                    background: #6c757d;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    padding: 12px 24px;
                    font-size: 1em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                ">Dismiss</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.querySelector('#viewAlertsBtn').addEventListener('click', () => {
        modal.style.display = 'none';
        // Already on alerts page, just scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    modal.querySelector('#dismissAlertBtn').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: scale(0.9) translateY(-20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }
        #viewAlertsBtn:hover { background: #e68900; }
        #dismissAlertBtn:hover { background: #5a6268; }
        .close-modal:hover { color: #333; }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    return modal;
}

// Dashboard integration - check alerts when accessing user manager panel
function checkDashboardAlerts() {
    console.log('Checking dashboard alerts...');
    
    // Check if we're on the dashboard page
    const isDashboard = window.location.pathname.includes('UserManager') || 
                       window.location.pathname.includes('UserManager/UserManager');
    
    if (isDashboard) {
        // Delay the check slightly to ensure page is fully loaded
        setTimeout(() => {
            checkCriticalAlerts();
        }, 1000);
    }
}

// Global function to be called from any user manager page
window.checkUserAlerts = function() {
    if (window.UserAlerts && window.UserAlerts.checkCriticalAlerts) {
        window.UserAlerts.checkCriticalAlerts();
    } else {
        console.log('UserAlerts not loaded yet');
    }
};

// Auto-check alerts on page load for dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check if this is a dashboard or user manager page
    const isUserManagerPage = window.location.pathname.includes('/Employee/UserManager') || 
                       window.location.pathname.includes('/Employee/UserManager/UserManager');
    
    if (isUserManagerPage) {
        // Check alerts after a short delay to ensure everything is loaded
        setTimeout(() => {
            checkDashboardAlerts();
        }, 2000);
    }
});

// Export functions for use in other modules
window.UserAlerts = {
    loadAlertsData,
    loadProductAlerts,
    loadRawMaterialAlerts,
    initializeUserAlerts,
    getStockStatus,
    formatTimestamp,
    checkCriticalAlerts,
    showCriticalAlertPopup,
    checkDashboardAlerts
};


