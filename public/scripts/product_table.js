// ----------------------------
// UTILITY FUNCTIONS
// ----------------------------
function getUserRole() {
    const roleElement = document.getElementById('user-role');
    return roleElement ? roleElement.value : null;
}

function getUserId() {
    const user_id = document.getElementById('user-id');
    return user_id ? user_id.value : null;
}

function showInfoMessage(message, type = 'success') {
    const container = document.getElementById('info-message-container');
    if (!container) return;
    container.innerHTML = `<div class="rounded-lg px-4 py-3 shadow-md text-white font-semibold text-center ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }">${message}</div>`;
    container.style.display = 'block';
    setTimeout(() => {
        container.style.display = 'none';
        container.innerHTML = '';
    }, 1000);
}

// ----------------------------
// MODAL HANDLERS
// ----------------------------
function openAddModal() {
    document.getElementById('add-product-modal').classList.remove('hidden');
}
function closeAddModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
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

// ----------------------------
// TABLE SCROLLER
// ----------------------------
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

// ----------------------------
// FILTER PRODUCTS
// ----------------------------
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

    const noResults = document.getElementById('no-results');
    if (visibleCount === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }
}

// ----------------------------
// ADD PRODUCT
// ----------------------------
document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const payload = {
        user_id: getUserId(),
        name: document.getElementById('add-name').value.trim(),
        sku: document.getElementById('add-sku').value.trim(),
        category: encodeURIComponent(document.getElementById('add-category').value),
        price: document.getElementById('add-price').value,
        description: document.getElementById('add-description').value.trim(),
        image_url: document.getElementById('add-image_url').value.trim() || null,
        brand_name: getUserRole() !== "vendor"
            ? document.getElementById('add-brand-name').value.trim()
            : document.getElementById('brandName').value.trim()
    };

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        // console.error('Submission error:', err);
        showInfoMessage('An error occurred while adding product.', 'error');
        closeAddModal();
    }
});

// ----------------------------
// EDIT PRODUCT
// ----------------------------
document.getElementById('edit-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const productId = document.getElementById('edit-product_id').value;
    if (!productId) {
        showInfoMessage('No product selected for editing', 'error');
        return;
    }

    const payload = {
        user_id: getUserId(),
        name: document.getElementById('edit-name').value.trim(),
        sku: document.getElementById('edit-sku').value.trim(),
        category: encodeURIComponent(document.getElementById('edit-category').value),
        price: document.getElementById('edit-price').value,
        description: document.getElementById('edit-description').value.trim(),
        image_url: document.getElementById('edit-image_url').value.trim() || null
    };

    if (getUserRole() !== "vendor") {
        payload.brand_name = document.getElementById('edit-brand-name').value.trim();
    }

    try {
        const response = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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
        // console.error(err);
        showInfoMessage('An error occurred while updating product.', 'error');
    }
});

// ----------------------------
// DELETE PRODUCT
// ----------------------------
async function deleteProduct() {
    if (!productToDelete) return;

    try {
        const response = await fetch(`/api/products/${encodeURIComponent(productToDelete)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: getUserId() })
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
        // console.error(err);
        showInfoMessage('An error occurred while deleting product.', 'error');
    }
}

// ----------------------------
// CATEGORY MANAGEMENT (ADMIN/STAFF)
// ----------------------------
if (getUserRole() !== 'vendor') {

    function openCategoryManagement() {
        document.getElementById('category-management-modal').classList.remove('hidden');
        loadCategories();

        // Sync color inputs
        ['new-category-bg', 'new-category-bg-text'].forEach(id => {
            document.getElementById(id).addEventListener('input', function() {
                const other = id === 'new-category-bg' ? 'new-category-bg-text' : 'new-category-bg';
                document.getElementById(other).value = this.value;
            });
        });
        ['new-category-text', 'new-category-text-text'].forEach(id => {
            document.getElementById(id).addEventListener('input', function() {
                const other = id === 'new-category-text' ? 'new-category-text-text' : 'new-category-text';
                document.getElementById(other).value = this.value;
            });
        });
    }

    function closeCategoryManagement() {
        document.getElementById('category-management-modal').classList.add('hidden');
    }

    function loadCategories() {
        fetch('/api/categories')
            .then(res => res.json())
            .then(categories => {
                const tbody = document.getElementById('categories-table-body');
                tbody.innerHTML = '';
                categories.forEach(cat => {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-gray-50';
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${cat.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded-full" style="background-color:${cat.bg_color}; color:${cat.text_color}">${cat.bg_color}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded-full" style="color:${cat.text_color}">${cat.text_color}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="openEditCategoryModal('${cat._id}', '${encodeURIComponent(cat.name)}', '${cat.bg_color}', '${cat.text_color}')" class="text-indigo-600 hover:text-indigo-900 mr-3"><i class="fas fa-edit"></i></button>
                            <button onclick="confirmDeleteCategory('${cat._id}')" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(err => {
                // console.error('Error loading categories:', err);
                showInfoMessage('Failed to load categories', 'error');
            });
    }
}

// ----------------------------
// INIT
// ----------------------------
document.addEventListener('DOMContentLoaded', function() {
    tableScroller();
    filterProducts();
    document.getElementById('search-input').addEventListener('input', filterProducts);
    document.getElementById('category-filter').addEventListener('change', filterProducts);
});
