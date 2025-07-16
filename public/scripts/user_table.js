function openAddModal() {
    document.getElementById('add-user-modal').classList.remove('hidden');
}

function closeAddModal() {
    document.getElementById('add-user-modal').classList.add('hidden');
}

function openEditModal(userId) {
    const row = document.querySelector(`[data-user-id="${userId}"]`);
    if (!row) return;

    document.getElementById('edit-user_id').value = userId;
    document.getElementById('edit-full_name').value = row.dataset.fullname;
    document.getElementById('edit-role').value = row.dataset.role;
    document.getElementById('edit-brand_name').value = row.dataset.brand || '';
    document.getElementById('edit-email').value = row.dataset.email;

    toggleBrandNameField('edit-role', 'edit-brand-name-container');
    document.getElementById('edit-user-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-user-modal').classList.add('hidden');
}

let userToDelete = null;

function confirmDelete(userId) {
    userToDelete = userId;
    document.getElementById('delete-confirm-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    userToDelete = null;
    document.getElementById('delete-confirm-modal').classList.add('hidden');
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

document.getElementById('add-user-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showInfoMessage('User added successfully!', 'success');
    closeAddModal();
});

document.getElementById('edit-user-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const userId = document.getElementById('edit-user_id').value;

    const payload = {
        full_name: document.getElementById('edit-full_name').value,
        email: document.getElementById('edit-email').value,
        role: document.getElementById('edit-role').value,
        brand_name: document.getElementById('edit-brand_name').value
    };

    // Optional: remove brand_name if not vendor
    if (payload.role !== 'vendor') {
        delete payload.brand_name;
    }

    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showInfoMessage('User updated successfully!', 'success');
            closeEditModal();
            setTimeout(() => location.reload(), 3000); // Give time for message to show
        } else {
            const error = await response.json();
            showInfoMessage(error.message || 'Failed to update user.', 'error');
        }
    } catch (err) {
        console.error(err);
        showInfoMessage('An error occurred while updating user.', 'error');
    }
});


async function deleteUser() {
    if (!userToDelete) return;

    try {
        const response = await fetch(`/admin/users/${userToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showInfoMessage('User deleted successfully!', 'success');
            closeDeleteModal();
            setTimeout(() => location.reload(), 3000); // Give time for message to show
        } else {
            const error = await response.json();
            showInfoMessage(error.message || 'Failed to delete user.', 'error');
        }
    } catch (err) {
        console.error(err);
        showInfoMessage('An error occurred while deleting user.', 'error');
    }
}


document.getElementById('add-role').addEventListener('change', function() {
    toggleBrandNameField('add-role', 'brand-name-container');
});

document.getElementById('edit-role').addEventListener('change', function() {
    toggleBrandNameField('edit-role', 'edit-brand-name-container');
});

function toggleBrandNameField(roleSelectId, containerId) {
    const role = document.getElementById(roleSelectId).value;
    const container = document.getElementById(containerId);
    
    if (role === 'vendor') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

document.getElementById('filter-btn').addEventListener('click', async function() {
    const roleFilter = document.getElementById('role-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    try {
        let users;
        
        if (roleFilter === 'all') {
            // Fetch all users when "All" is selected
            const response = await fetch('/admin/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            users = await response.json();
        } else {
            // Fetch users filtered by role
            const response = await fetch(`/admin/users/filter?role=${encodeURIComponent(roleFilter)}`);
            if (!response.ok) throw new Error('Failed to fetch users');
            users = await response.json();
        }

        // Apply search filter on the client side for both "All" and specific roles
        if (searchTerm) {
            users = users.filter(user =>
                user.full_name.toLowerCase().includes(searchTerm)
            );
        }

        updateUserTable(users);
    } catch (err) {
        console.error(err);
        showInfoMessage('Failed to filter users.', 'error');
    }
});

function updateUserTable(users) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';
    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-4 text-center text-sm text-gray-500">No users found.</td></tr>`;
        return;
    }
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';
        tr.setAttribute('data-user-id', user._id);
        tr.setAttribute('data-fullname', user.full_name);
        tr.setAttribute('data-email', user.email);
        tr.setAttribute('data-role', user.role);
        tr.setAttribute('data-brand', user.brand_name || '');
        tr.innerHTML = `
            <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 truncate max-w-[100px] md:max-w-none">${user._id}</td>
            <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                <div class="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[80px] md:max-w-[120px] lg:max-w-none">${user.full_name}</div>
            </td>
            <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'vendor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">${user.role}</span>
            </td>
            <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 truncate max-w-[80px] md:max-w-[120px] lg:max-w-none">${user.brand_name || ''}</td>
            <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500">${user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
            <td class="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium">
                <div class="flex space-x-3">
                    <button onclick="openEditModal('${user._id}')" class="text-indigo-600 hover:text-indigo-900">
                        <i class="fas fa-edit text-sm md:text-base"></i>
                    </button>
                    ${window.currentUserId !== user._id ? `<button onclick="confirmDelete('${user._id}')" class="text-red-600 hover:text-red-900"><i class="fas fa-trash text-sm md:text-base"></i></button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// Add real-time search functionality
let searchTimeout;
document.getElementById('search-input').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async function() {
        const roleFilter = document.getElementById('role-filter').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        try {
            let users;
            
            if (roleFilter === 'all') {
                // Fetch all users when "All" is selected
                const response = await fetch('/admin/users');
                if (!response.ok) throw new Error('Failed to fetch users');
                users = await response.json();
            } else {
                // Fetch users filtered by role
                const response = await fetch(`/admin/users/filter?role=${encodeURIComponent(roleFilter)}`);
                if (!response.ok) throw new Error('Failed to fetch users');
                users = await response.json();
            }

            // Apply search filter on the client side for both "All" and specific roles
            if (searchTerm) {
                users = users.filter(user =>
                    user.full_name.toLowerCase().includes(searchTerm)
                );
            }

            updateUserTable(users);
        } catch (err) {
            console.error(err);
            showInfoMessage('Failed to search users.', 'error');
        }
    }, 300); // 300ms delay for better performance
});

document.addEventListener('DOMContentLoaded', function() {
    const tableScroller = document.getElementById('table-scroller');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    
    if (tableScroller && scrollLeftBtn && scrollRightBtn) {
        // Show/hide scroll buttons based on scroll position
        function updateScrollButtons() {
            const scrollLeft = tableScroller.scrollLeft;
            const maxScroll = tableScroller.scrollWidth - tableScroller.clientWidth;
            
            if (scrollLeft <= 0) {
                scrollLeftBtn.classList.add('disabled');
            } else {
                scrollLeftBtn.classList.remove('disabled');
            }
            
            if (scrollLeft >= maxScroll - 5) { // 5px tolerance
                scrollRightBtn.classList.add('disabled');
            } else {
                scrollRightBtn.classList.remove('disabled');
            }
        }
        
        // Initial check
        updateScrollButtons();
        
        // Scroll event listener
        tableScroller.addEventListener('scroll', updateScrollButtons);
        
        // Button click handlers
        scrollLeftBtn.addEventListener('click', function() {
            tableScroller.scrollBy({
                left: -200,
                behavior: 'smooth'
            });
        });
        
        scrollRightBtn.addEventListener('click', function() {
            tableScroller.scrollBy({
                left: 200,
                behavior: 'smooth'
            });
        });
        
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