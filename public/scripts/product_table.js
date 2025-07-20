function openAddModal() {
    document.getElementById('add-product-modal').classList.remove('hidden');
}

function closeAddModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
}

function selectRoute(role) {
    var route;

    switch(role) {
        case "vendor":
            route = "/vendor/product";
            break;
        case "employee":
            route = "/user/product";
            break;
        case "admin":
            route = "/admin/product";
            break;
        default:
            throw new Error("wtf");
    }
    return route;
}

function showInfoMessage(message, type = 'success') {
    const container = document.getElementById('info-message-container');
    if (!container) return;
    container.innerHTML = `<div class="rounded-lg px-4 py-3 shadow-md text-white font-semibold text-center ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}">${message}</div>`;
    container.style.display = 'block';
    setTimeout(() => {
        container.style.display = 'none';
        container.innerHTML = '';
    }, 3000);
}

function openEditModal(productId) {
    const row = document.querySelector(`[data-product-id="${productId}"]`);
    if (!row) return;

    var role = document.getElementById('user-role').value;

    document.getElementById('edit-product_id').value = productId;
    document.getElementById('edit-name').value = row.dataset.name;
    document.getElementById('edit-sku').value = row.dataset.sku;
    document.getElementById('edit-category').value = row.dataset.category;
    document.getElementById('edit-price').value = row.dataset.price;
    document.getElementById('edit-stock_qty').value = row.dataset.stock;
    document.getElementById('edit-description').value = row.dataset.description;
    document.getElementById('edit-image_url').value = row.dataset.image;
    if (role !== "vendor") {
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

    var role = document.getElementById('user-role').value;
    var payload;

    if (role === "vendor") {
        payload = {
            name: document.getElementById('add-name').value,
            sku: document.getElementById('add-sku').value,
            category: document.getElementById('add-category').value,
            price: document.getElementById('add-price').value,
            stock_qty: document.getElementById('add-stock_qty').value,
            description: document.getElementById('add-description').value,
            image_url: document.getElementById('add-image_url').value,
            brand_name: document.getElementById('brandName').value
        };
    }
    else {
        payload = {
            name: document.getElementById('add-name').value,
            sku: document.getElementById('add-sku').value,
            category: document.getElementById('add-category').value,
            price: document.getElementById('add-price').value,
            stock_qty: document.getElementById('add-stock_qty').value,
            description: document.getElementById('add-description').value,
            image_url: document.getElementById('add-image_url').value,
            brand_name: document.getElementById('add-brand-name').value
        };
    }

    try {
        const response = await fetch(selectRoute(role), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showInfoMessage('Product added successfully!', 'success');
            document.getElementById('add-product-form').reset();
            
            // Only reload after showing success message
            setTimeout(() => {
                closeAddModal();
                location.reload();
            }, 1500);
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

    var payload;
    const productId = document.getElementById('edit-product_id').value;
    var role = document.getElementById('user-role').value;

    if (role === "vendor") {
        payload = {
            name: document.getElementById('edit-name').value,
            sku: document.getElementById('edit-sku').value,
            category: document.getElementById('edit-category').value,
            price: document.getElementById('edit-price').value,
            stock_qty: document.getElementById('edit-stock_qty').value,
            description: document.getElementById('edit-description').value,
            image_url: document.getElementById('edit-image_url').value,
            brand_name: document.getElementById('brandName').value
        };
    }
    else {
        payload = {
            name: document.getElementById('edit-name').value,
            sku: document.getElementById('edit-sku').value,
            category: document.getElementById('edit-category').value,
            price: document.getElementById('edit-price').value,
            stock_qty: document.getElementById('edit-stock_qty').value,
            description: document.getElementById('edit-description').value,
            image_url: document.getElementById('edit-image_url').value,
            brand_name: document.getElementById('edit-brand-name').value,
        };
    }

    try {
        const response = await fetch(`${selectRoute(role)}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Product updated successfully!');
            closeEditModal();
            location.reload();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to update product.');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while updating product.');
    }
});

async function deleteProduct() {
    if (!productToDelete) return;

    var role = document.getElementById('user-role').value;

    try {
        const response = await fetch(`${selectRoute(role)}/${productToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showInfoMessage('Product deleted successfully!', 'success');
            closeDeleteModal();
            location.reload();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to delete product.');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while deleting product.');
    }
}

document.getElementById('filter-btn').addEventListener('click', function() {
    const categoryFilter = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    // In a real app, you would send these filters to your backend
    console.log('Filtering by category:', categoryFilter, 'and search term:', searchTerm);
});

document.addEventListener('DOMContentLoaded', function() {
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
});