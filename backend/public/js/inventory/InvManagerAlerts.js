document.addEventListener('DOMContentLoaded', function() {
    fetchAlerts();

    async function fetchAlerts() {
        try {
            const response = await fetch('/Employee/Inventory/InvManagerAlerts/Data'); // Inventory Manager API endpoint
            const data = await response.json();

            if (data.success) {
                displayProducts(data.products);
                displayRawMaterials(data.rawMaterials);
            } else {
                console.error('Error fetching alerts:', data.message);
            }
        } catch (error) {
            console.error('Network or parsing error:', error);
        }
    }

    function displayProducts(products) {
        const tableBody = document.querySelector('#lowStockProductsTable tbody');
        const noLowStockProductsMessage = document.getElementById('noLowStockProducts');
        tableBody.innerHTML = '';

        if (products.length === 0) {
            noLowStockProductsMessage.style.display = 'block';
            return;
        }

        noLowStockProductsMessage.style.display = 'none';
        products.forEach(product => {
            let statusClass = '';
            let statusText = '';
            if (product.StockQuantity === 0) {
                statusClass = 'out-of-stock';
                statusText = 'Out of Stock';
            } else if (product.StockQuantity > 0 && product.StockQuantity <= 10) {
                statusClass = 'critical-stock';
                statusText = 'Critical Stock';
            } else if (product.StockQuantity > 10 && product.StockQuantity <= 20) {
                statusClass = 'low-stock';
                statusText = 'Low Stock';
            } else {
                statusClass = '';
                statusText = '';
            }
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${product.ProductID}</td>
                <td>${product.Name}</td>
                <td>${product.StockQuantity}</td>
                <td class="${statusClass}">${statusText}</td>
            `;
        });
    }

    function displayRawMaterials(materials) {
        const tableBody = document.querySelector('#lowStockMaterialsTable tbody');
        const noLowStockMaterialsMessage = document.getElementById('noLowStockMaterials');
        tableBody.innerHTML = '';

        if (materials.length === 0) {
            noLowStockMaterialsMessage.style.display = 'block';
            return;
        }

        noLowStockMaterialsMessage.style.display = 'none';
        materials.forEach(material => {
            let statusClass = '';
            let statusText = '';
            if (material.QuantityAvailable === 0) {
                statusClass = 'out-of-stock';
                statusText = 'Out of Stock';
            } else if (material.QuantityAvailable > 0 && material.QuantityAvailable <= 10) {
                statusClass = 'critical-stock';
                statusText = 'Critical Stock';
            } else if (material.QuantityAvailable > 10 && material.QuantityAvailable <= 20) {
                statusClass = 'low-stock';
                statusText = 'Low Stock';
            } else {
                statusClass = '';
                statusText = '';
            }
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${material.MaterialID}</td>
                <td>${material.Name}</td>
                <td>${material.QuantityAvailable}</td>
                <td>${material.Unit}</td>
                <td class="${statusClass}">${statusText}</td>
            `;
        });
    }
});



