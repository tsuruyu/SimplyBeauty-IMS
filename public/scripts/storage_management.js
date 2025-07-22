document.addEventListener('DOMContentLoaded', function() {
    loadStorages();
    
    // Setup form event listeners
    document.getElementById('add-storage-form').addEventListener('submit', handleAddStorage);
    document.getElementById('edit-storage-form').addEventListener('submit', handleUpdateStorage);
    document.getElementById('add-product-to-storage-form').addEventListener('submit', handleAddProductToStorage);
});

let currentStorageId = null;

async function loadStorages() {
    try {
        const response = await fetch('/api/storages');
        const storages = await response.json();
        
        const tableBody = document.getElementById('storage-table-body');
        tableBody.innerHTML = '';
        
        if (storages.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="px-4 py-4 text-center text-sm text-gray-500">
                        No storage locations found.
                    </td>
                </tr>
            `;
            return;
        }
        
        storages.forEach(storage => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                    <div class="text-xs md:text-sm font-medium text-gray-900">${storage.name}</div>
                </td>
                <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500">
                    ${storage.location || 'N/A'}
                </td>
                <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium">
                    <div class="flex space-x-3">
                        <button onclick="viewStorageDetails('${storage._id}')" class="text-blue-600 hover:text-blue-900">
                            <i class="fas fa-eye text-sm md:text-base"></i>
                        </button>
                        <button onclick="openEditStorageModal('${storage._id}', '${storage.name}', '${storage.location || ''}')" class="text-indigo-600 hover:text-indigo-900">
                            <i class="fas fa-edit text-sm md:text-base"></i>
                        </button>
                        <button onclick="confirmDeleteStorage('${storage._id}', '${storage.name}')" class="text-red-600 hover:text-red-900">
                            <i class="fas fa-trash text-sm md:text-base"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        showMessage('Error loading storage locations: ' + error.message, 'error');
    }
}

async function handleAddStorage(e) {
    e.preventDefault();
    
    const name = document.getElementById('storage-name').value;
    const location = document.getElementById('storage-location').value;
    
    try {
        const response = await fetch('/api/storages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, location }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to add storage location');
        }
        
        closeAddStorageModal();
        loadStorages();
        showMessage('Storage location added successfully', 'success');
    } catch (error) {
        showMessage('Error adding storage location: ' + error.message, 'error');
    }
}

async function handleUpdateStorage(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-storage-id').value;
    const name = document.getElementById('edit-storage-name').value;
    const location = document.getElementById('edit-storage-location').value;
    
    try {
        const response = await fetch(`/api/storages/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, location }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update storage location');
        }
        
        closeEditStorageModal();
        loadStorages();
        showMessage('Storage location updated successfully', 'success');
    } catch (error) {
        showMessage('Error updating storage location: ' + error.message, 'error');
    }
}

async function viewStorageDetails(storageId) {
    try {
        currentStorageId = storageId;
        
        // Load storage details
        const response = await fetch(`/api/storages/${storageId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load storage details');
        }
        
        // Update the modal title
        document.getElementById('storage-details-title').textContent = 
            `Storage: ${data.storage.name} (${data.storage.location || 'No location'})`;
        
        // Set the current storage ID in the add product form
        document.getElementById('current-storage-id').value = storageId;
        
        // Load products into the select dropdown
        await loadProductsForSelect();
        
        // Populate the products table
        const tableBody = document.getElementById('storage-products-table-body');
        tableBody.innerHTML = '';
        
        if (data.products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-4 py-4 text-center text-sm text-gray-500">
                        No products in this location.
                    </td>
                </tr>
            `;
        } else {
            data.products.forEach(product => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${product.product_id?.name || 'Unknown Product'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.product_id?.sku || 'N/A'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.quantity}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="updateProductInStorage('${product._id}', ${product.quantity})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="removeProductFromStorage('${product._id}')" class="text-red-600 hover:text-red-900">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        // Show the modal
        document.getElementById('storage-details-modal').classList.remove('hidden');
    } catch (error) {
        showMessage('Error loading storage details: ' + error.message, 'error');
    }
}

async function loadProductsForSelect() {
    try {
        const response = await fetch('/api/products'); // You'll need to add this endpoint
        const products = await response.json();
        
        const select = document.getElementById('product-select');
        select.innerHTML = '<option value="">Select a product</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product._id;
            option.textContent = `${product.name} (${product.sku})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function handleAddProductToStorage(e) {
    e.preventDefault();
    
    const storageId = document.getElementById('current-storage-id').value;
    const productId = document.getElementById('product-select').value;
    const quantity = document.getElementById('product-quantity').value;
    
    if (!productId || !quantity) {
        showMessage('Please select a product and enter a quantity', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/product-storage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                storage_id: storageId,
                quantity: parseInt(quantity)
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to add product to storage');
        }
        
        // Refresh the storage details
        viewStorageDetails(storageId);
        showMessage('Product added to storage successfully', 'success');
        
        // Reset the form
        document.getElementById('add-product-to-storage-form').reset();
    } catch (error) {
        showMessage('Error adding product to storage: ' + error.message, 'error');
    }
}

async function updateProductInStorage(productStorageId, currentQuantity) {
    const newQuantity = prompt('Enter new quantity:', currentQuantity);
    
    if (newQuantity === null || newQuantity === '' || isNaN(newQuantity)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/product-storage/${productStorageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quantity: parseInt(newQuantity)
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update product quantity');
        }
        
        // Refresh the storage details
        viewStorageDetails(currentStorageId);
        showMessage('Product quantity updated successfully', 'success');
    } catch (error) {
        showMessage('Error updating product quantity: ' + error.message, 'error');
    }
}

async function removeProductFromStorage(productStorageId) {
    if (!confirm('Are you sure you want to remove this product from storage?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/product-storage/${productStorageId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove product from storage');
        }
        
        // Refresh the storage details
        viewStorageDetails(currentStorageId);
        showMessage('Product removed from storage successfully', 'success');
    } catch (error) {
        showMessage('Error removing product from storage: ' + error.message, 'error');
    }
}

function openAddStorageModal() {
    document.getElementById('add-storage-form').reset();
    document.getElementById('add-storage-modal').classList.remove('hidden');
}

function closeAddStorageModal() {
    document.getElementById('add-storage-modal').classList.add('hidden');
}

function openEditStorageModal(id, name, location) {
    document.getElementById('edit-storage-id').value = id;
    document.getElementById('edit-storage-name').value = name;
    document.getElementById('edit-storage-location').value = location || '';
    document.getElementById('edit-storage-modal').classList.remove('hidden');
}

function closeEditStorageModal() {
    document.getElementById('edit-storage-modal').classList.add('hidden');
}

function closeStorageDetailsModal() {
    document.getElementById('storage-details-modal').classList.add('hidden');
    currentStorageId = null;
}

function confirmDeleteStorage(id, name) {
    currentStorageId = id;
    document.getElementById('delete-storage-confirm-modal').classList.remove('hidden');
}

function closeDeleteStorageModal() {
    document.getElementById('delete-storage-confirm-modal').classList.add('hidden');
    currentStorageId = null;
}

async function deleteStorage() {
    if (!currentStorageId) return;
    
    try {
        const response = await fetch(`/api/storages/${currentStorageId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete storage location');
        }
        
        closeDeleteStorageModal();
        loadStorages();
        showMessage('Storage location deleted successfully', 'success');
    } catch (error) {
        showMessage('Error deleting storage location: ' + error.message, 'error');
    }
}

function showMessage(message, type) {
    const container = document.getElementById('info-message-container');
    container.innerHTML = `
        <div class="bg-${type === 'error' ? 'red' : 'green'}-100 border border-${type === 'error' ? 'red' : 'green'}-400 text-${type === 'error' ? 'red' : 'green'}-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">${message}</span>
            <span class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.style.display='none'">
                <svg class="fill-current h-6 w-6 text-${type === 'error' ? 'red' : 'green'}-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <title>Close</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
            </span>
        </div>
    `;
    container.style.display = 'block';
    
    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

// Make functions available globally
window.openAddStorageModal = openAddStorageModal;
window.closeAddStorageModal = closeAddStorageModal;
window.openEditStorageModal = openEditStorageModal;
window.closeEditStorageModal = closeEditStorageModal;
window.closeStorageDetailsModal = closeStorageDetailsModal;
window.viewStorageDetails = viewStorageDetails;
window.confirmDeleteStorage = confirmDeleteStorage;
window.closeDeleteStorageModal = closeDeleteStorageModal;
window.deleteStorage = deleteStorage;
window.updateProductInStorage = updateProductInStorage;
window.removeProductFromStorage = removeProductFromStorage;