// Inventory Products JavaScript
// Handles product management functionality for inventory users

document.addEventListener('DOMContentLoaded', function() {
    // Initialize inventory products functionality
    initializeInventoryProducts();
    
    // Load products data
    loadProductsData();
    
    // Setup event listeners
    setupEventListeners();
});

function initializeInventoryProducts() {
    console.log('Initializing Inventory Products...');
    
    // Wait for userPermissions to be initialized
    if (window.userPermissions) {
        // Check if user has inventory permissions
        if (!window.userPermissions.hasPermission('inventory')) {
            console.log('User does not have inventory permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        
        // Update UI based on permissions
        window.userPermissions.updateUI();
    } else {
        // Fallback: wait a bit and try again
        setTimeout(initializeInventoryProducts, 100);
        return;
    }
    
    // Initialize product-specific features
    initializeProductCRUD();
    initializeProductSearch();
    initializeProductCategories();
    initializeProductVariations();
}

function loadProductsData() {
    // Load products list
    loadProducts();
    
    // Load product categories
    loadProductCategories();
    
    // Load product statistics
    loadProductStatistics();
}

function loadProducts() {
    fetch('/api/inventory/products')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayProducts(data.products);
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
        });
}

function displayProducts(products) {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        productElement.innerHTML = `
            <div class="product-header">
                <div class="product-image">
                    <img src="${product.image || '/images/no-image.png'}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-sku">SKU: ${product.sku}</div>
                    <div class="product-category">${product.category}</div>
                </div>
                <div class="product-status status-${product.status}">${product.status}</div>
            </div>
            <div class="product-details">
                <div class="product-price">$${product.price}</div>
                <div class="product-stock">Stock: ${product.stock}</div>
                <div class="product-cost">Cost: $${product.cost}</div>
            </div>
            <div class="product-actions">
                <button class="btn-edit" data-product-id="${product.id}">Edit</button>
                <button class="btn-view" data-product-id="${product.id}">View</button>
                <button class="btn-variations" data-product-id="${product.id}">Variations</button>
                <button class="btn-stock" data-product-id="${product.id}">Update Stock</button>
                <button class="btn-delete" data-product-id="${product.id}">Delete</button>
            </div>
        `;
        container.appendChild(productElement);
    });
    
    // Add event listeners
    setupProductActions();
}

function loadProductCategories() {
    fetch('/api/inventory/categories')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayProductCategories(data.categories);
            }
        })
        .catch(error => {
            console.error('Error loading product categories:', error);
        });
}

function displayProductCategories(categories) {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.innerHTML = `
            <div class="category-header">
                <div class="category-name">${category.name}</div>
                <div class="category-count">${category.productCount} products</div>
            </div>
            <div class="category-description">${category.description}</div>
            <div class="category-actions">
                <button class="btn-edit-category" data-category-id="${category.id}">Edit</button>
                <button class="btn-delete-category" data-category-id="${category.id}">Delete</button>
            </div>
        `;
        container.appendChild(categoryElement);
    });
    
    // Add event listeners
    setupCategoryActions();
}

function loadProductStatistics() {
    fetch('/api/inventory/products/statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayProductStatistics(data.statistics);
            }
        })
        .catch(error => {
            console.error('Error loading product statistics:', error);
        });
}

function displayProductStatistics(statistics) {
    // Update statistics cards
    updateStatCard('totalProducts', statistics.totalProducts);
    updateStatCard('activeProducts', statistics.activeProducts);
    updateStatCard('lowStockProducts', statistics.lowStockProducts);
    updateStatCard('outOfStockProducts', statistics.outOfStockProducts);
    
    // Update category distribution chart
    updateCategoryDistributionChart(statistics.categoryDistribution);
    
    // Update stock levels chart
    updateStockLevelsChart(statistics.stockLevels);
}

function updateStatCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        card.textContent = value || 0;
    }
}

function updateCategoryDistributionChart(categoryDistribution) {
    const chartContainer = document.getElementById('categoryDistributionChart');
    if (!chartContainer || !categoryDistribution) return;
    
    chartContainer.innerHTML = '';
    
    Object.entries(categoryDistribution).forEach(([category, count]) => {
        const barElement = document.createElement('div');
        barElement.className = 'category-bar';
        barElement.innerHTML = `
            <div class="category-name">${category}</div>
            <div class="category-bar-fill" style="width: ${(count / Math.max(...Object.values(categoryDistribution))) * 100}%"></div>
            <div class="category-count">${count}</div>
        `;
        chartContainer.appendChild(barElement);
    });
}

function updateStockLevelsChart(stockLevels) {
    const chartContainer = document.getElementById('stockLevelsChart');
    if (!chartContainer || !stockLevels) return;
    
    chartContainer.innerHTML = '';
    
    const maxStock = Math.max(...stockLevels.map(level => level.count));
    
    stockLevels.forEach(level => {
        const levelElement = document.createElement('div');
        levelElement.className = 'stock-level-item';
        levelElement.innerHTML = `
            <div class="level-name">${level.name}</div>
            <div class="level-bar" style="height: ${(level.count / maxStock) * 100}%"></div>
            <div class="level-count">${level.count}</div>
        `;
        chartContainer.appendChild(levelElement);
    });
}

function initializeProductCRUD() {
    console.log('Product CRUD initialized');
    
    // Setup product creation
    setupProductCreation();
    
    // Setup product editing
    setupProductEditing();
    
    // Setup product deletion
    setupProductDeletion();
}

function setupProductCreation() {
    const createProductForm = document.getElementById('createProductForm');
    if (createProductForm) {
        createProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateProduct(this);
        });
    }
}

function handleCreateProduct(form) {
    const formData = new FormData(form);
    const productData = Object.fromEntries(formData);
    
    // Validate form data
    const validation = validateProductData(productData);
    if (!validation.isValid) {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification(validation.errors.join(', '), 'error');
        }
        return;
    }
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showLoading('createProductStatus', 'Creating product...');
    }
    
    fetch('/api/inventory/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Product created successfully!');
            }
            form.reset();
            loadProducts(); // Refresh products list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to create product: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error creating product:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error creating product', 'error');
        }
    })
    .finally(() => {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.hideLoading('createProductStatus');
        }
    });
}

function setupProductEditing() {
    // Setup product editing functionality
    console.log('Product editing setup completed');
}

function setupProductDeletion() {
    // Setup product deletion functionality
    console.log('Product deletion setup completed');
}

function initializeProductSearch() {
    console.log('Product search initialized');
    
    // Setup search functionality
    setupProductSearch();
    
    // Setup filtering
    setupProductFiltering();
}

function setupProductSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchProducts(this.value);
        });
    }
}

function searchProducts(searchTerm) {
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function setupProductFiltering() {
    // Filter by category
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterProductsByCategory(this.value);
        });
    }
    
    // Filter by status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterProductsByStatus(this.value);
        });
    }
    
    // Filter by stock level
    const stockFilter = document.getElementById('stockFilter');
    if (stockFilter) {
        stockFilter.addEventListener('change', function() {
            filterProductsByStock(this.value);
        });
    }
}

function filterProductsByCategory(category) {
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
        const productCategory = item.querySelector('.product-category').textContent;
        if (category === 'all' || productCategory.includes(category)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterProductsByStatus(status) {
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
        const productStatus = item.querySelector('.product-status').textContent;
        if (status === 'all' || productStatus.includes(status)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterProductsByStock(stockLevel) {
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
        const stockText = item.querySelector('.product-stock').textContent;
        const stock = parseInt(stockText.match(/\d+/)[0]);
        
        let show = false;
        switch (stockLevel) {
            case 'all':
                show = true;
                break;
            case 'in-stock':
                show = stock > 0;
                break;
            case 'low-stock':
                show = stock > 0 && stock <= 10;
                break;
            case 'out-of-stock':
                show = stock === 0;
                break;
        }
        
        item.style.display = show ? 'block' : 'none';
    });
}

function initializeProductCategories() {
    console.log('Product categories initialized');
    
    // Setup category management
    setupCategoryManagement();
}

function setupCategoryManagement() {
    // Setup category creation
    setupCategoryCreation();
    
    // Setup category editing
    setupCategoryEditing();
}

function setupCategoryCreation() {
    const createCategoryForm = document.getElementById('createCategoryForm');
    if (createCategoryForm) {
        createCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateCategory(this);
        });
    }
}

function handleCreateCategory(form) {
    const formData = new FormData(form);
    const categoryData = Object.fromEntries(formData);
    
    // Validate form data
    if (!categoryData.name || categoryData.name.trim() === '') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Category name is required', 'error');
        }
        return;
    }
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showLoading('createCategoryStatus', 'Creating category...');
    }
    
    fetch('/api/inventory/categories', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Category created successfully!');
            }
            form.reset();
            loadProductCategories(); // Refresh categories list
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to create category: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error creating category:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error creating category', 'error');
        }
    })
    .finally(() => {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.hideLoading('createCategoryStatus');
        }
    });
}

function setupCategoryEditing() {
    // Setup category editing functionality
    console.log('Category editing setup completed');
}

function initializeProductVariations() {
    console.log('Product variations initialized');
    
    // Setup variation management
    setupVariationManagement();
}

function setupVariationManagement() {
    // Setup variation creation
    setupVariationCreation();
    
    // Setup variation editing
    setupVariationEditing();
}

function setupVariationCreation() {
    const createVariationForm = document.getElementById('createVariationForm');
    if (createVariationForm) {
        createVariationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateVariation(this);
        });
    }
}

function handleCreateVariation(form) {
    const formData = new FormData(form);
    const variationData = Object.fromEntries(formData);
    
    // Validate form data
    if (!variationData.name || variationData.name.trim() === '') {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Variation name is required', 'error');
        }
        return;
    }
    
    if (window.EmployeeUtils) {
        window.EmployeeUtils.showLoading('createVariationStatus', 'Creating variation...');
    }
    
    fetch('/api/inventory/variations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(variationData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Variation created successfully!');
            }
            form.reset();
        } else {
            if (window.EmployeeUtils) {
                window.EmployeeUtils.showNotification('Failed to create variation: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error creating variation:', error);
        if (window.EmployeeUtils) {
            window.EmployeeUtils.showNotification('Error creating variation', 'error');
        }
    })
    .finally(() => {
        if (window.EmployeeUtils) {
            window.EmployeeUtils.hideLoading('createVariationStatus');
        }
    });
}

function setupVariationEditing() {
    // Setup variation editing functionality
    console.log('Variation editing setup completed');
}

function setupEventListeners() {
    // Setup product actions
    setupProductActions();
    
    // Setup category actions
    setupCategoryActions();
    
    // Setup bulk actions
    setupBulkActions();
}

function setupProductActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
            const productId = e.target.getAttribute('data-product-id');
            editProduct(productId);
        }
        
        if (e.target.classList.contains('btn-view')) {
            const productId = e.target.getAttribute('data-product-id');
            viewProduct(productId);
        }
        
        if (e.target.classList.contains('btn-variations')) {
            const productId = e.target.getAttribute('data-product-id');
            manageProductVariations(productId);
        }
        
        if (e.target.classList.contains('btn-stock')) {
            const productId = e.target.getAttribute('data-product-id');
            updateProductStock(productId);
        }
        
        if (e.target.classList.contains('btn-delete')) {
            const productId = e.target.getAttribute('data-product-id');
            deleteProduct(productId);
        }
    });
}

function setupCategoryActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit-category')) {
            const categoryId = e.target.getAttribute('data-category-id');
            editCategory(categoryId);
        }
        
        if (e.target.classList.contains('btn-delete-category')) {
            const categoryId = e.target.getAttribute('data-category-id');
            deleteCategory(categoryId);
        }
    });
}

function setupBulkActions() {
    // Setup bulk product actions
    const bulkActionSelect = document.getElementById('bulkActionSelect');
    const bulkActionButton = document.getElementById('bulkActionButton');
    
    if (bulkActionSelect && bulkActionButton) {
        bulkActionButton.addEventListener('click', function() {
            const action = bulkActionSelect.value;
            const selectedProducts = getSelectedProducts();
            
            if (selectedProducts.length === 0) {
                if (window.EmployeeUtils) {
                    window.EmployeeUtils.showNotification('Please select products first', 'warning');
                }
                return;
            }
            
            performBulkProductAction(action, selectedProducts);
        });
    }
}

function getSelectedProducts() {
    const checkboxes = document.querySelectorAll('.product-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

function performBulkProductAction(action, productIds) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm(`Are you sure you want to ${action} ${productIds.length} products?`, 'Bulk Action')
            .then(confirmed => {
                if (confirmed) {
                    fetch('/api/inventory/products/bulk-action', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ action, productIds })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification(`Bulk ${action} completed successfully!`);
                            loadProducts(); // Refresh products list
                        } else {
                            window.EmployeeUtils.showNotification(`Bulk ${action} failed`, 'error');
                        }
                    })
                    .catch(error => {
                        console.error(`Error performing bulk ${action}:`, error);
                        window.EmployeeUtils.showNotification(`Error performing bulk ${action}`, 'error');
                    });
                }
            });
    }
}

// Action functions
function editProduct(productId) {
    window.location.href = `/Employee/Inventory/EditProduct/${productId}`;
}

function viewProduct(productId) {
    window.location.href = `/Employee/Inventory/ViewProduct/${productId}`;
}

function manageProductVariations(productId) {
    window.location.href = `/Employee/Inventory/ProductVariations/${productId}`;
}

function updateProductStock(productId) {
    // Open stock update modal
    const modal = document.getElementById('updateStockModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('updateStockProductId').value = productId;
    }
}

function deleteProduct(productId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to delete this product? This action cannot be undone.', 'Delete Product')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/inventory/products/${productId}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Product deleted successfully!');
                            loadProducts(); // Refresh products list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to delete product', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting product:', error);
                        window.EmployeeUtils.showNotification('Error deleting product', 'error');
                    });
                }
            });
    }
}

function editCategory(categoryId) {
    window.location.href = `/Employee/Inventory/EditCategory/${categoryId}`;
}

function deleteCategory(categoryId) {
    if (window.EmployeeUtils) {
        window.EmployeeUtils.confirm('Are you sure you want to delete this category?', 'Delete Category')
            .then(confirmed => {
                if (confirmed) {
                    fetch(`/api/inventory/categories/${categoryId}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.EmployeeUtils.showNotification('Category deleted successfully!');
                            loadProductCategories(); // Refresh categories list
                        } else {
                            window.EmployeeUtils.showNotification('Failed to delete category', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting category:', error);
                        window.EmployeeUtils.showNotification('Error deleting category', 'error');
                    });
                }
            });
    }
}

function validateProductData(productData) {
    const errors = [];
    
    if (!productData.name || productData.name.trim() === '') {
        errors.push('Product name is required');
    }
    
    if (!productData.sku || productData.sku.trim() === '') {
        errors.push('SKU is required');
    }
    
    if (!productData.price || isNaN(parseFloat(productData.price))) {
        errors.push('Valid price is required');
    }
    
    if (!productData.cost || isNaN(parseFloat(productData.cost))) {
        errors.push('Valid cost is required');
    }
    
    if (!productData.category || productData.category.trim() === '') {
        errors.push('Category is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Export functions for use in other modules
window.InventoryProducts = {
    loadProductsData,
    loadProducts,
    loadProductCategories,
    loadProductStatistics,
    createProduct: handleCreateProduct,
    editProduct,
    deleteProduct,
    viewProduct,
    manageProductVariations,
    updateProductStock,
    createCategory: handleCreateCategory,
    editCategory,
    deleteCategory,
    createVariation: handleCreateVariation,
    initializeInventoryProducts
};
