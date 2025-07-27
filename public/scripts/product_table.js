function getUserRole() {
    const roleElement = document.getElementById('user-role');
    return roleElement ? roleElement.value : null;
}

function getUserId() {
    const user_id = document.getElementById('user-id');
    return user_id ? user_id.value : null;
}

function openAddModal() {
    document.getElementById('add-product-modal').classList.remove('hidden');
}

function closeAddModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
}

function showInfoMessage(message, type = 'success') {
    const container = document.getElementById('info-message-container');
    if (!container) return;
    container.innerHTML = `<div class="rounded-lg px-4 py-3 shadow-md text-white font-semibold text-center ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}">${message}</div>`;
    container.style.display = 'block';
    setTimeout(() => {
        container.style.display = 'none';
        container.innerHTML = '';
    }, 1000);
}

function openEditModal(productId) {
    const row = document.querySelector(`[data-product-id="${productId}"]`);
    if (!row) return;

    document.getElementById('edit-product_id').value = productId;
    document.getElementById('edit-name').value = row.dataset.name;
    document.getElementById('edit-sku').value = row.dataset.sku;
    document.getElementById('edit-category').value = row.dataset.category;
    document.getElementById('edit-price').value = row.dataset.price;
    document.getElementById('edit-description').value = row.dataset.description;
    document.getElementById('edit-image_url').value = row.dataset.image;
    if (getUserRole() !== "vendor") {
        document.getElementById('edit-brand-name').value = row.dataset.brandName;
    }

    document.getElementById('edit-product-modal').classList.remove('hidden');

}

function closeEditModal() {
    document.getElementById('edit-product-modal').classList.add('hidden');
}

let productToDelete = null;

function confirmDelete(productId) {
    productToDelete = productId;
    document.getElementById('delete-confirm-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    productToDelete = null;
    document.getElementById('delete-confirm-modal').classList.add('hidden');
}

document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const payload = {
        user_id: getUserId(),
        name: document.getElementById('add-name').value,
        sku: document.getElementById('add-sku').value,
        category: document.getElementById('add-category').value,
        price: document.getElementById('add-price').value,
        description: document.getElementById('add-description').value,
        image_url: document.getElementById('add-image_url').value || null
    };

    // Only add brand_name if not vendor
    if (getUserRole() !== "vendor") {
        payload.brand_name = document.getElementById('add-brand-name').value;
    }

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showInfoMessage('Product added successfully!', 'success');
            document.getElementById('add-product-form').reset();
            
            setTimeout(() => {
                closeAddModal();
                location.reload();
            }, 1000);
        } else {
            const error = await response.json();
            showInfoMessage(error.message || 'Failed to add product.', 'error');
        }
    } catch (err) {
        console.error('Submission error:', err);
        showInfoMessage('An error occurred while adding product.', 'error');
        closeAddModal();
    }
});

document.getElementById('edit-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const productId = document.getElementById('edit-product_id').value;
    if (!productId) {
        showInfoMessage('No product selected for editing', 'error');
        return;
    }

    const payload = {
        user_id: getUserId(),
        name: document.getElementById('edit-name').value,
        sku: document.getElementById('edit-sku').value,
        category: document.getElementById('edit-category').value,
        price: document.getElementById('edit-price').value,
        description: document.getElementById('edit-description').value,
        image_url: document.getElementById('edit-image_url').value || null
    };

    // Only add brand_name if not vendor
    if (getUserRole() !== "vendor") {
        payload.brand_name = document.getElementById('edit-brand-name').value;
    }

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showInfoMessage('Product updated successfully!', 'success');
            closeEditModal();
            location.reload();
        } else {
            const error = await response.json();
            showInfoMessage(error.message || 'Failed to update product.', 'error');
        }
    } catch (err) {
        console.error(err);
        showInfoMessage('An error occurred while updating product.', 'error');
    }
});

async function deleteProduct() {
    if (!productToDelete) return;

    try {
        const response = await fetch(`/api/products/${productToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: getUserId()
            })
        });

        if (response.ok) {
            showInfoMessage('Product deleted successfully!', 'success');
            closeDeleteModal();
            location.reload();
        } else {
            const error = await response.json();
            showInfoMessage(error.message || 'Failed to delete product.', 'error');
        }
    } catch (err) {
        console.error(err);
        showInfoMessage('An error occurred while deleting product.', 'error');
    }
}

function tableScroller() {
const tableScroller = document.getElementById('table-scroller');
    
    if (tableScroller) {
        document.addEventListener('keydown', function(e) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                if (e.key === 'ArrowLeft') {
                    tableScroller.scrollBy({ left: -100, behavior: 'smooth' });
                    e.preventDefault();
                } else if (e.key === 'ArrowRight') {
                    tableScroller.scrollBy({ left: 100, behavior: 'smooth' });
                    e.preventDefault();
                }
            }
        });
    }
}

if (getUserRole() !== 'vendor') {
    // Category Management Functions
    function openCategoryManagement() {
        document.getElementById('category-management-modal').classList.remove('hidden');
        loadCategories();
        
        // Sync color inputs
        document.getElementById('new-category-bg').addEventListener('input', function() {
            document.getElementById('new-category-bg-text').value = this.value;
        });
        document.getElementById('new-category-bg-text').addEventListener('input', function() {
            document.getElementById('new-category-bg').value = this.value;
        });
        document.getElementById('new-category-text').addEventListener('input', function() {
            document.getElementById('new-category-text-text').value = this.value;
        });
        document.getElementById('new-category-text-text').addEventListener('input', function() {
            document.getElementById('new-category-text').value = this.value;
        });
    }

    function closeCategoryManagement() {
        document.getElementById('category-management-modal').classList.add('hidden');
    }

    function loadCategories() {
        fetch('/api/categories')
            .then(response => response.json())
            .then(categories => {
                const tbody = document.getElementById('categories-table-body');
                tbody.innerHTML = '';
                
                categories.forEach(category => {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-gray-50';
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${category.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded-full" style="background-color: ${category.bg_color}; color: ${category.text_color}">
                                ${category.bg_color}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded-full" style="color: ${category.text_color}">
                                ${category.text_color}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="openEditCategoryModal('${category._id}', '${category.name}', '${category.bg_color}', '${category.text_color}')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="confirmDeleteCategory('${category._id}')" class="text-red-600 hover:text-red-900">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(error => {
                console.error('Error loading categories:', error);
                showInfoMessage('Failed to load categories', 'error');
            });
    }

    // Add new category
    document.getElementById('add-category-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('new-category-name').value;
        const bg_color = document.getElementById('new-category-bg-text').value;
        const text_color = document.getElementById('new-category-text-text').value;
        
        fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                bg_color,
                text_color
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                showInfoMessage(data.message, data.message.includes('success') ? 'success' : 'error');
                if (data.message.includes('success')) {
                    loadCategories();
                    document.getElementById('add-category-form').reset();
                    document.getElementById('new-category-bg').value = '#3b82f6';
                    document.getElementById('new-category-text').value = '#ffffff';
                }
                setTimeout(() => {
                    closeCategoryManagement();
                    location.reload();
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Error adding category:', error);
            showInfoMessage('Failed to add category', 'error');
        });
    });

    // Edit category modal
    function openEditCategoryModal(id, name, bgColor, textColor) {
        document.getElementById('edit-category-id').value = id;
        document.getElementById('edit-cat-name').value = name;
        document.getElementById('edit-cat-bg').value = bgColor;
        document.getElementById('edit-cat-bg-text').value = bgColor;
        document.getElementById('edit-cat-text').value = textColor;
        document.getElementById('edit-cat-text-text').value = textColor;
        
        document.getElementById('edit-category-modal').classList.remove('hidden');
        
        // Sync color inputs
        document.getElementById('edit-cat-bg').addEventListener('input', function() {
            document.getElementById('edit-cat-bg-text').value = this.value;
        });
        document.getElementById('edit-cat-bg-text').addEventListener('input', function() {
            document.getElementById('edit-cat-bg').value = this.value;
        });
        document.getElementById('edit-cat-text').addEventListener('input', function() {
            document.getElementById('edit-cat-text-text').value = this.value;
        });
        document.getElementById('edit-cat-text-text').addEventListener('input', function() {
            document.getElementById('edit-cat-text').value = this.value;
        });
    }

    function closeEditCategoryModal() {
        document.getElementById('edit-category-modal').classList.add('hidden');
    }

    // Update category
    document.getElementById('edit-category-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('edit-category-id').value;
        const name = document.getElementById('edit-cat-name').value;
        const bg_color = document.getElementById('edit-cat-bg-text').value;
        const text_color = document.getElementById('edit-cat-text-text').value;
        
        fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                bg_color,
                text_color
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                showInfoMessage(data.message, data.message.includes('success') ? 'success' : 'error');
                if (data.message.includes('success')) {
                    loadCategories();
                    setTimeout(() => {
                        closeEditCategoryModal();
                        location.reload();
                    }, 1000);
                }
            }
        })
        .catch(error => {
            console.error('Error updating category:', error);
            showInfoMessage('Failed to update category', 'error');
        });
    });

    // Delete category
    let categoryToDelete = null;

    function confirmDeleteCategory(id) {
        categoryToDelete = id;
        document.getElementById('delete-category-modal').classList.remove('hidden');
    }

    function closeDeleteCategoryModal() {
        categoryToDelete = null;
        document.getElementById('delete-category-modal').classList.add('hidden');
    }

    function deleteCategory() {
        if (!categoryToDelete) return;
        
        fetch(`/api/categories/${categoryToDelete}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                showInfoMessage(data.message, data.message.includes('success') ? 'success' : 'error');
                if (data.message.includes('success')) {
                    categoryToDelete = null;
                    loadCategories();
                    setTimeout(() => {
                        closeDeleteModal();
                        location.reload();
                    }, 1000);
                }
            }
        })
        .catch(error => {
            console.error('Error deleting category:', error);
            showInfoMessage('Failed to delete category', 'error');
        });
    }
}

function filterProducts() {
    const categoryFilter = document.getElementById('category-filter').value.toLowerCase();
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr[data-product-id]');
    let visibleCount = 0;

    rows.forEach(row => {
        const name = row.dataset.name.toLowerCase();
        const sku = row.dataset.sku.toLowerCase();
        const category = row.dataset.category.toLowerCase();
        const brandName = row.dataset.brandName ? row.dataset.brandName.toLowerCase() : '';
        const description = row.dataset.description ? row.dataset.description.toLowerCase() : '';

        // Check if the row matches both filters
        const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
        const matchesSearch = searchTerm === '' || 
                             name.includes(searchTerm) || 
                             sku.includes(searchTerm) || 
                             category.includes(searchTerm) ||
                             brandName.includes(searchTerm) ||
                             description.includes(searchTerm);

        if (matchesCategory && matchesSearch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Show/hide the "no results" message
    const noResults = document.getElementById('no-results');
    if (visibleCount === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    tableScroller();
    filterProducts(); 
    document.getElementById('search-input').addEventListener('input', filterProducts);
    document.getElementById('category-filter').addEventListener('change', filterProducts)

});