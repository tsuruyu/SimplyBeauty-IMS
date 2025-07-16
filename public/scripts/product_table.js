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
    document.getElementById('edit-stock_qty').value = row.dataset.stock;
    document.getElementById('edit-description').value = row.dataset.description;
    document.getElementById('edit-image_url').value = row.dataset.image;

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

document.getElementById('add-product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Product added successfully!');
    closeAddModal();
});

document.getElementById('edit-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const productId = document.getElementById('edit-product_id').value;

    const payload = {
        name: document.getElementById('edit-name').value,
        sku: document.getElementById('edit-sku').value,
        category: document.getElementById('edit-category').value,
        price: document.getElementById('edit-price').value,
        stock_qty: document.getElementById('edit-stock_qty').value,
        description: document.getElementById('edit-description').value,
        image_url: document.getElementById('edit-image_url').value
    };

    try {
        const response = await fetch(`/vendor/product/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Product updated successfully!');
            closeEditModal();
            location.reload(); // Or you could dynamically update the row
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

    try {
        const response = await fetch(`/vendor/product/${productToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Product deleted successfully!');
            closeDeleteModal();
            location.reload(); // Or dynamically remove the row
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
        function updateScrollButtons() {
            const scrollLeft = tableScroller.scrollLeft;
            const maxScroll = tableScroller.scrollWidth - tableScroller.clientWidth;
            
            // You can add scroll buttons if needed
        }
        
        // Initial check
        updateScrollButtons();
        
        // Scroll event listener
        tableScroller.addEventListener('scroll', updateScrollButtons);
        
        // Also enable arrow key navigation
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