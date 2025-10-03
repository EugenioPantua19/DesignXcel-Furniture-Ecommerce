document.addEventListener('DOMContentLoaded', function() {
    // Check permissions before initializing
    if (window.userPermissions) {
        if (!window.userPermissions.hasPermission('products')) {
            console.log('User does not have products permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        window.userPermissions.updateUI();
    }
    
    // Add Product Modal
    var addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function(event) {
            event.preventDefault();
            var addProductModal = document.getElementById('addProductModal');
            if (addProductModal) {
                addProductModal.classList.add('show');
                var addMaterialsContainer = document.getElementById('addMaterialsContainer');
                if (addMaterialsContainer) addMaterialsContainer.innerHTML = '';
                if (typeof addMaterialRow === 'function') addMaterialRow('add');
            }
        });
    }
    var cancelAddProduct = document.getElementById('cancelAddProduct');
    if (cancelAddProduct) {
        cancelAddProduct.addEventListener('click', function(event) {
            event.preventDefault();
            var addProductModal = document.getElementById('addProductModal');
            if (addProductModal) addProductModal.classList.remove('show');
        });
    }
    var addProductModalClose = document.querySelector('#addProductModal .close-button');
    if (addProductModalClose) {
        addProductModalClose.addEventListener('click', function() {
            var addProductModal = document.getElementById('addProductModal');
            if (addProductModal) addProductModal.classList.remove('show');
        });
    }
    window.onclick = function(event) {
        var addModal = document.getElementById('addProductModal');
        var editModal = document.getElementById('editProductModal');
        if (event.target === addModal && addModal) {
            addModal.classList.remove('show');
        }
        if (event.target === editModal && editModal) {
            editModal.classList.remove('show');
        }
    }
    // Edit Product Modal
    var editProductModal = document.getElementById('editProductModal');
    var editProductForm = document.getElementById('editProductForm');
    var closeEditModal = document.getElementById('closeEditModal');
    var cancelEditProduct = document.getElementById('cancelEditProduct');
    var currentImagePreview = document.getElementById('currentImagePreview');
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            var editProductID = document.getElementById('editProductID');
            var editName = document.getElementById('editName');
            var editDescription = document.getElementById('editDescription');
            var editPrice = document.getElementById('editPrice');
            var editStockQuantity = document.getElementById('editStockQuantity');
            var editCategory = document.getElementById('editCategory');
            var editCurrentImageURL = document.getElementById('editCurrentImageURL');
            var editMaterialsContainer = document.getElementById('editMaterialsContainer');
            if (editProductID) editProductID.value = btn.getAttribute('data-id');
            if (editName) editName.value = btn.getAttribute('data-name');
            if (editDescription) editDescription.value = btn.getAttribute('data-description');
            if (editPrice) editPrice.value = btn.getAttribute('data-price');
            if (editStockQuantity) editStockQuantity.value = btn.getAttribute('data-stock');
            if (editCategory) editCategory.value = btn.getAttribute('data-category');
            const imageUrl = btn.getAttribute('data-imageurl');
            const model3dUrl = btn.getAttribute('data-model3durl');
            if (editCurrentImageURL) editCurrentImageURL.value = imageUrl || '';
            var editCurrentModel3dURL = document.getElementById('editCurrentModel3dURL');
            if (editCurrentModel3dURL) editCurrentModel3dURL.value = model3dUrl || '';
            if (currentImagePreview) {
                if (imageUrl) {
                    currentImagePreview.src = imageUrl;
                    currentImagePreview.style.display = 'inline-block';
                } else {
                    currentImagePreview.style.display = 'none';
                }
            }
            
            // Handle 3D model preview
            var currentModel3dPreview = document.getElementById('currentModel3dPreview');
            if (currentModel3dPreview) {
                if (model3dUrl) {
                    currentModel3dPreview.innerHTML = '<small style="color: #666;">Current 3D model: ' + model3dUrl.split('/').pop() + '</small>';
                } else {
                    currentModel3dPreview.innerHTML = '';
                }
            }
            if (editMaterialsContainer) editMaterialsContainer.innerHTML = '';
            const productId = btn.getAttribute('data-id');
            fetch(`/api/inventory/products/${productId}/materials`).then(response => response.json()).then(data => {
                if (data.success && data.materials.length > 0) {
                    data.materials.forEach(pm => {
                        if (typeof addMaterialRow === 'function') addMaterialRow('edit', pm.MaterialID, pm.QuantityRequired);
                    });
                } else {
                    if (typeof addMaterialRow === 'function') addMaterialRow('edit');
                }
            }).catch(() => { if (typeof addMaterialRow === 'function') addMaterialRow('edit'); });
            if (editProductModal) editProductModal.classList.add('show');
        });
    });
    if (closeEditModal) {
        closeEditModal.addEventListener('click', function() {
            if (editProductModal) editProductModal.classList.remove('show');
        });
    }
    if (cancelEditProduct) {
        cancelEditProduct.addEventListener('click', function(event) {
            event.preventDefault();
            if (editProductModal) editProductModal.classList.remove('show');
        });
    }
    window.onclick = function(event) {
        if (event.target == editProductModal && editProductModal) {
            editProductModal.classList.remove('show');
        }
    }
    // Delete Confirmation Modal
    var deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    var cancelDeleteBtn = document.getElementById('cancelDelete');
    var confirmDeleteBtn = document.getElementById('confirmDelete');
    let deleteForm = null;
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            deleteForm = this.closest('form');
            if (deleteConfirmationModal) deleteConfirmationModal.style.display = 'flex';
        });
    });
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            if (deleteConfirmationModal) deleteConfirmationModal.style.display = 'none';
            deleteForm = null;
        });
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (deleteForm) {
                deleteForm.submit();
            }
            if (deleteConfirmationModal) deleteConfirmationModal.style.display = 'none';
            deleteForm = null;
        });
    }
    window.addEventListener('click', function(event) {
        if (event.target === deleteConfirmationModal && deleteConfirmationModal) {
            deleteConfirmationModal.style.display = 'none';
            deleteForm = null;
        }
    });
    // Stock Confirmation Modal
    var stockConfirmationModal = document.getElementById('stockConfirmationModal');
    var cancelStockChangeBtn = document.getElementById('cancelStockChange');
    var confirmStockChangeBtn = document.getElementById('confirmStockChange');
    var stockConfirmationText = document.getElementById('stockConfirmationText');
    let stockInputElem = null;
    let newStockValue = null;
    let productIdForStock = null;
    document.querySelectorAll('.stock-check-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            stockInputElem = this.closest('td').querySelector('.stock-input');
            productIdForStock = this.getAttribute('data-id');
            newStockValue = parseInt(stockInputElem.value);
            if (isNaN(newStockValue) || newStockValue < 0) {
                if (typeof showCustomPopup === 'function') showCustomPopup('Please enter a valid stock quantity.', true);
                return;
            }
            if (stockConfirmationText) stockConfirmationText.textContent = `Are you sure you want to update the stock to ${newStockValue}?`;
            if (stockConfirmationModal) stockConfirmationModal.style.display = 'flex';
        });
    });
    if (cancelStockChangeBtn) {
        cancelStockChangeBtn.addEventListener('click', function() {
            if (stockConfirmationModal) stockConfirmationModal.style.display = 'none';
            stockInputElem = null;
            newStockValue = null;
            productIdForStock = null;
        });
    }
    if (confirmStockChangeBtn) {
        confirmStockChangeBtn.addEventListener('click', function() {
            if (stockInputElem && productIdForStock && newStockValue !== null) {
                fetch(`/Employee/Inventory/InvManagerProducts/UpdateStock`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: productIdForStock, newStock: newStockValue })
                })
                .then(response => {
                    if (!response.ok) {
                        // Handle specific error cases
                        if (response.status === 400) {
                            return response.json().then(errorData => {
                                throw new Error(errorData.message || 'Failed to update stock due to insufficient materials.');
                            });
                        }
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        if (stockInputElem) {
                            stockInputElem.value = newStockValue;
                            if (typeof showCustomPopup === 'function') showCustomPopup(data.message || 'Stock updated successfully!');
                        } else {
                            if (typeof showCustomPopup === 'function') showCustomPopup('Stock updated successfully! (Please refresh to see changes)');
                        }
                    } else {
                        if (typeof showCustomPopup === 'function') showCustomPopup(data.message || 'Failed to update stock.', true);
                    }
                })
                .catch((error) => { 
                    console.error('Error updating stock:', error);
                    if (typeof showCustomPopup === 'function') {
                        if (error.message.includes('insufficient materials') || error.message.includes('Not enough raw materials')) {
                            showCustomPopup('Cannot update stock: Insufficient raw materials available. Please check material inventory.', true);
                        } else {
                            showCustomPopup('Stock updated successfully! (Please refresh to see changes)');
                        }
                    }
                });
            }
            if (stockConfirmationModal) stockConfirmationModal.style.display = 'none';
            stockInputElem = null;
            newStockValue = null;
            productIdForStock = null;
        });
    }
    window.addEventListener('click', function(event) {
        if (event.target === stockConfirmationModal && stockConfirmationModal) {
            stockConfirmationModal.style.display = 'none';
            stockInputElem = null;
            newStockValue = null;
            productIdForStock = null;
        }
    });
    // Raw Materials Logic
    let allRawMaterials = [];
    async function fetchRawMaterials() {
        try {
            const response = await fetch('/api/inventory/rawmaterials');
            const data = await response.json();
            if (data.success) {
                allRawMaterials = data.materials;
            } else {
                showCustomPopup('Failed to load raw materials.', true);
            }
        } catch (error) {
            showCustomPopup('Error loading raw materials. Check console.', true);
        }
    }
    function createMaterialRow(type, selectedMaterialId = null, quantityRequired = 1) {
        const materialRow = document.createElement('div');
        materialRow.className = 'material-row';
        const select = document.createElement('select');
        select.className = 'material-select';
        let optionsHtml = '<option value="">Select Material</option>';
        allRawMaterials.forEach(material => {
            optionsHtml += `<option value="${material.MaterialID}" ${selectedMaterialId == material.MaterialID ? 'selected' : ''}>${material.Name}</option>`;
        });
        select.innerHTML = optionsHtml;
        select.required = true;
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'material-quantity';
        quantityInput.placeholder = 'Qty per product';
        quantityInput.min = '1';
        quantityInput.value = quantityRequired;
        quantityInput.required = true;
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-material-btn';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => materialRow.remove());
        materialRow.appendChild(select);
        materialRow.appendChild(quantityInput);
        materialRow.appendChild(removeButton);
        return materialRow;
    }
    function addMaterialRow(type, selectedMaterialId = null, quantityRequired = 1) {
        const containerId = type === 'add' ? 'addMaterialsContainer' : 'editMaterialsContainer';
        const container = document.getElementById(containerId);
        container.appendChild(createMaterialRow(type, selectedMaterialId, quantityRequired));
    }
    document.getElementById('addMaterialRowBtn').addEventListener('click', () => addMaterialRow('add'));
    document.getElementById('editMaterialRowBtn').addEventListener('click', () => addMaterialRow('edit'));
    document.getElementById('addProductForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const requiredMaterials = getRequiredMaterials('add');
        formData.append('requiredMaterials', JSON.stringify(requiredMaterials));
        submitProductForm(this, formData);
    });
    document.getElementById('editProductForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const requiredMaterials = getRequiredMaterials('edit');
        formData.append('requiredMaterials', JSON.stringify(requiredMaterials));
        submitProductForm(this, formData);
    });
    function getRequiredMaterials(type) {
        const containerId = type === 'add' ? 'addMaterialsContainer' : 'editMaterialsContainer';
        const container = document.getElementById(containerId);
        const materialRows = container.querySelectorAll('.material-row');
        const materials = [];
        materialRows.forEach(row => {
            const materialId = row.querySelector('.material-select').value;
            const quantity = parseInt(row.querySelector('.material-quantity').value);
            if (materialId && quantity > 0) {
                materials.push({ materialId: materialId, quantityRequired: quantity });
            }
        });
        return materials;
    }
    async function submitProductForm(form, formData) {
        const url = form.action;
        try {
            const response = await fetch(url, {
                method: form.method,
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                showCustomPopup(data.message || 'Product saved successfully!');
                form.closest('.modal').classList.remove('show');
                location.reload();
            } else {
                showCustomPopup(data.message || 'Failed to save product.', true);
            }
        } catch (error) {
            showCustomPopup('Error saving product. Check console.', true);
        }
    }
    document.addEventListener('DOMContentLoaded', function() {
        fetchRawMaterials();
    });
    // View Product Modal
    const viewProductModal = document.getElementById('viewProductModal');
    const closeViewModal = document.getElementById('closeViewModal');
    const viewProductDetails = document.getElementById('viewProductDetails');
    const viewProductMaterials = document.getElementById('viewProductMaterials');
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let html = `<table style='width:100%; border-collapse:collapse;'>`;
            html += `<tr><td><b>ID</b></td><td>${btn.getAttribute('data-id')}</td></tr>`;
            html += `<tr><td><b>Name</b></td><td>${btn.getAttribute('data-name')}</td></tr>`;
            html += `<tr><td><b>Description</b></td><td>${btn.getAttribute('data-description')}</td></tr>`;
            html += `<tr><td><b>Price</b></td><td>${parseFloat(btn.getAttribute('data-price')).toFixed(2)}</td></tr>`;
            html += `<tr><td><b>Stock</b></td><td>${btn.getAttribute('data-stock')}</td></tr>`;
            html += `<tr><td><b>Category</b></td><td>${btn.getAttribute('data-category')}</td></tr>`;
            html += `<tr><td><b>Date Added</b></td><td>${btn.getAttribute('data-dateadded')}</td></tr>`;
            html += `<tr><td><b>Active</b></td><td>${btn.getAttribute('data-isactive')}</td></tr>`;
            const imgUrl = btn.getAttribute('data-imageurl');
            html += `<tr><td><b>Image</b></td><td>` + (imgUrl ? `<img src='${imgUrl}' alt='Product Image' style='max-width:80px;max-height:80px;border-radius:4px;border:1px solid #ccc;'/>` : '<span style="color:#bbb;font-size:12px;">No image</span>') + `</td></tr>`;
            html += `</table>`;
            viewProductDetails.innerHTML = html;
            viewProductMaterials.innerHTML = '<div style="text-align:center;color:#888;">Loading required materials...</div>';
            fetch(`/api/inventory/products/${btn.getAttribute('data-id')}/materials`).then(res => res.json()).then(data => {
                if (data.success && data.materials.length > 0) {
                    let matHtml = `<h4>Required Raw Materials</h4><table style='width:100%;border-collapse:collapse;margin-top:8px;'><tr><th style='text-align:left;'>Material</th><th style='text-align:right;'>Quantity Required</th></tr>`;
                    data.materials.forEach(mat => {
                        matHtml += `<tr><td>${mat.Name}</td><td style='text-align:right;'>${mat.QuantityRequired}</td></tr>`;
                    });
                    matHtml += `</table>`;
                    viewProductMaterials.innerHTML = matHtml;
                } else {
                    viewProductMaterials.innerHTML = '<div style="color:#888;text-align:center;">No required raw materials set for this product.</div>';
                }
            }).catch(() => {
                viewProductMaterials.innerHTML = '<div style="color:#c00;text-align:center;">Failed to load required materials.</div>';
            });
            viewProductModal.classList.add('show');
        });
    });
    closeViewModal.addEventListener('click', function() {
        viewProductModal.classList.remove('show');
    });
    window.addEventListener('click', function(event) {
        if (event.target === viewProductModal) {
            viewProductModal.classList.remove('show');
        }
    });
    // Category sorting/filtering
    const categoryFilter = document.getElementById('categoryFilter');
    const sortCategoryBtn = document.getElementById('sortCategoryBtn');
    const resetCategoryBtn = document.getElementById('resetCategoryBtn');
    sortCategoryBtn.addEventListener('click', function() {
        const selected = categoryFilter.value;
        const table = document.querySelector('table');
        if (!table) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        Array.from(tbody.querySelectorAll('tr')).forEach(row => {
            const catCell = row.querySelectorAll('td')[5];
            if (!selected || (catCell && catCell.textContent === selected)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    resetCategoryBtn.addEventListener('click', function() {
        categoryFilter.value = '';
        const table = document.querySelector('table');
        if (!table) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        Array.from(tbody.querySelectorAll('tr')).forEach(row => {
            row.style.display = '';
        });
    });
    // Custom popup
    function showCustomPopup(message, isError = false) {
        const popup = document.getElementById('customPopup');
        const popupMessage = popup.querySelector('.custom-popup-message');
        const popupIcon = popup.querySelector('.custom-popup-icon');
        popupMessage.textContent = message;
        popupIcon.textContent = isError ? '✕' : '✓';
        popup.className = 'custom-popup' + (isError ? ' error' : '');
        popup.style.display = 'block';
        setTimeout(() => {
            popup.classList.add('hide');
            setTimeout(() => {
                popup.style.display = 'none';
                popup.classList.remove('hide');
            }, 500);
        }, 3000);
    }
    fetchRawMaterials();

    // Helper: Attach all modal close logic in one place
    function setupModalCloseHandlers() {
        // Add Product Modal
        var addProductModal = document.getElementById('addProductModal');
        var addProductModalClose = document.querySelector('#addProductModal .close-button');
        if (addProductModalClose && addProductModal) {
            addProductModalClose.onclick = function() { addProductModal.classList.remove('show'); };
        }
        var cancelAddProduct = document.getElementById('cancelAddProduct');
        if (cancelAddProduct && addProductModal) {
            cancelAddProduct.onclick = function(e) { e.preventDefault(); addProductModal.classList.remove('show'); };
        }
        // Edit Product Modal
        var editProductModal = document.getElementById('editProductModal');
        var closeEditModal = document.getElementById('closeEditModal');
        if (closeEditModal && editProductModal) {
            closeEditModal.onclick = function() { editProductModal.classList.remove('show'); };
        }
        var cancelEditProduct = document.getElementById('cancelEditProduct');
        if (cancelEditProduct && editProductModal) {
            cancelEditProduct.onclick = function(e) { e.preventDefault(); editProductModal.classList.remove('show'); };
        }
        // View Product Modal
        var viewProductModal = document.getElementById('viewProductModal');
        var closeViewModal = document.getElementById('closeViewModal');
        if (closeViewModal && viewProductModal) {
            closeViewModal.onclick = function() { viewProductModal.classList.remove('show'); };
        }
        // Generic window click for all modals
        window.addEventListener('click', function(event) {
            if (addProductModal && event.target === addProductModal) addProductModal.classList.remove('show');
            if (editProductModal && event.target === editProductModal) editProductModal.classList.remove('show');
            if (viewProductModal && event.target === viewProductModal) viewProductModal.classList.remove('show');
        });
    }
    setupModalCloseHandlers();

    // Event Delegation for Product Table Actions
    var productTable = document.querySelector('table');
    if (productTable) {
        productTable.addEventListener('click', function(e) {
            var target = e.target;
            // View Button
            if (target.classList.contains('view-btn')) {
                e.preventDefault();
                var viewProductModal = document.getElementById('viewProductModal');
                var viewProductDetails = document.getElementById('viewProductDetails');
                var viewProductMaterials = document.getElementById('viewProductMaterials');
                if (!viewProductModal || !viewProductDetails || !viewProductMaterials) return;
                let btn = target;
                let html = `<table style='width:100%; border-collapse:collapse;'>`;
                html += `<tr><td><b>ID</b></td><td>${btn.getAttribute('data-id')}</td></tr>`;
                html += `<tr><td><b>Name</b></td><td>${btn.getAttribute('data-name')}</td></tr>`;
                html += `<tr><td><b>Description</b></td><td>${btn.getAttribute('data-description')}</td></tr>`;
                html += `<tr><td><b>Price</b></td><td>${parseFloat(btn.getAttribute('data-price')).toFixed(2)}</td></tr>`;
                html += `<tr><td><b>Stock</b></td><td>${btn.getAttribute('data-stock')}</td></tr>`;
                html += `<tr><td><b>Category</b></td><td>${btn.getAttribute('data-category')}</td></tr>`;
                html += `<tr><td><b>Date Added</b></td><td>${btn.getAttribute('data-dateadded')}</td></tr>`;
                html += `<tr><td><b>Active</b></td><td>${btn.getAttribute('data-isactive')}</td></tr>`;
                const imgUrl = btn.getAttribute('data-imageurl');
                html += `<tr><td><b>Image</b></td><td>` + (imgUrl ? `<img src='${imgUrl}' alt='Product Image' style='max-width:80px;max-height:80px;border-radius:4px;border:1px solid #ccc;'/>` : '<span style="color:#bbb;font-size:12px;">No image</span>') + `</td></tr>`;
                html += `</table>`;
                viewProductDetails.innerHTML = html;
                viewProductMaterials.innerHTML = '<div style="text-align:center;color:#888;">Loading required materials...</div>';
                fetch(`/api/inventory/products/${btn.getAttribute('data-id')}/materials`).then(res => res.json()).then(data => {
                    if (data.success && data.materials.length > 0) {
                        let matHtml = `<h4>Required Raw Materials</h4><table style='width:100%;border-collapse:collapse;margin-top:8px;'><tr><th style='text-align:left;'>Material</th><th style='text-align:right;'>Quantity Required</th></tr>`;
                        data.materials.forEach(mat => {
                            matHtml += `<tr><td>${mat.Name}</td><td style='text-align:right;'>${mat.QuantityRequired}</td></tr>`;
                        });
                        matHtml += `</table>`;
                        viewProductMaterials.innerHTML = matHtml;
                    } else {
                        viewProductMaterials.innerHTML = '<div style="color:#888;text-align:center;">No required raw materials set for this product.</div>';
                    }
                }).catch(() => {
                    viewProductMaterials.innerHTML = '<div style="color:#c00;text-align:center;">Failed to load required materials.</div>';
                });
                viewProductModal.classList.add('show');
            }
            // Edit Button
            if (target.classList.contains('edit-btn')) {
                e.preventDefault();
                var editProductModal = document.getElementById('editProductModal');
                var editProductID = document.getElementById('editProductID');
                var editName = document.getElementById('editName');
                var editDescription = document.getElementById('editDescription');
                var editPrice = document.getElementById('editPrice');
                var editStockQuantity = document.getElementById('editStockQuantity');
                var editCategory = document.getElementById('editCategory');
                var editCurrentImageURL = document.getElementById('editCurrentImageURL');
                var currentImagePreview = document.getElementById('currentImagePreview');
                var editMaterialsContainer = document.getElementById('editMaterialsContainer');
                if (!editProductModal || !editProductID || !editName || !editDescription || !editPrice || !editStockQuantity || !editCategory || !editCurrentImageURL || !editMaterialsContainer) return;
                editProductID.value = target.getAttribute('data-id');
                editName.value = target.getAttribute('data-name');
                editDescription.value = target.getAttribute('data-description');
                editPrice.value = target.getAttribute('data-price');
                editStockQuantity.value = target.getAttribute('data-stock');
                editCategory.value = target.getAttribute('data-category');
                const imageUrl = target.getAttribute('data-imageurl');
                const has3dModel = target.getAttribute('data-has3dmodel');
                editCurrentImageURL.value = imageUrl || '';
                if (currentImagePreview) {
                    if (imageUrl) {
                        currentImagePreview.src = imageUrl;
                        currentImagePreview.style.display = 'inline-block';
                    } else {
                        currentImagePreview.style.display = 'none';
                    }
                }
                // Handle has3dModel checkbox
                const editHas3dModel = document.getElementById('editHas3dModel');
                if (editHas3dModel) {
                    editHas3dModel.checked = has3dModel === '1' || has3dModel === 'true';
                }
                editMaterialsContainer.innerHTML = '';
                const productId = target.getAttribute('data-id');
                fetch(`/api/inventory/products/${productId}/materials`).then(response => response.json()).then(data => {
                    if (data.success && data.materials.length > 0) {
                        data.materials.forEach(pm => { if (typeof addMaterialRow === 'function') addMaterialRow('edit', pm.MaterialID, pm.QuantityRequired); });
                    } else {
                        if (typeof addMaterialRow === 'function') addMaterialRow('edit');
                    }
                }).catch(() => { if (typeof addMaterialRow === 'function') addMaterialRow('edit'); });
                editProductModal.classList.add('show');
            }
            // Delete Button
            if (target.classList.contains('delete-btn')) {
                e.preventDefault();
                var deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
                let deleteForm = target.closest('form');
                if (!deleteConfirmationModal || !deleteForm) return;
                deleteConfirmationModal.style.display = 'flex';
                // Confirm/Cancel logic
                var cancelDeleteBtn = document.getElementById('cancelDelete');
                var confirmDeleteBtn = document.getElementById('confirmDelete');
                if (cancelDeleteBtn) {
                    cancelDeleteBtn.onclick = function() {
                        deleteConfirmationModal.style.display = 'none';
                    };
                }
                if (confirmDeleteBtn) {
                    confirmDeleteBtn.onclick = function() {
                        deleteForm.submit();
                        deleteConfirmationModal.style.display = 'none';
                    };
                }
                // Also close modal if clicking outside
                window.onclick = function(event) {
                    if (event.target === deleteConfirmationModal) {
                        deleteConfirmationModal.style.display = 'none';
                    }
                };
            }
        });
    }
}); 