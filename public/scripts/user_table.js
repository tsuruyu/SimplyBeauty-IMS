const securityQuestions = [
  { "id": 1, "question": "What was the name of your first stuffed toy?" },
  { "id": 2, "question": "What is the name of a teacher who had a strong impact on you?" },
  { "id": 3, "question": "What is the title of the first book you ever finished reading?" },
  { "id": 4, "question": "What was the make and model of your first car?" },
  { "id": 5, "question": "What is the name of the first place you traveled outside your home country?" },
  { "id": 6, "question": "What is the name of your favorite childhood friend?" },
  { "id": 7, "question": "What was the name of your first employer?" },
  { "id": 8, "question": "What city did you go to for your first concert?" },
  { "id": 9, "question": "What was your favorite subject in high school?" },
  { "id": 10, "question": "What is the name of the street where your best friend lived?" }
];

function populateSecurityQuestions() {
    const addQ1 = document.getElementById('add-security-question-1');
    const addQ2 = document.getElementById('add-security-question-2');
    const editQ1 = document.getElementById('edit-security-question-1');
    const editQ2 = document.getElementById('edit-security-question-2');

    [addQ1, addQ2, editQ1, editQ2].forEach(select => {
        select.innerHTML = '';
        // Add placeholder
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a security question';
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);

        securityQuestions.forEach(q => {
            const option = document.createElement('option');
            option.value = q.question;
            option.textContent = q.question;
            select.appendChild(option);
        });
    });

    // Add change listeners to prevent duplicate selection
    addQ1.addEventListener('change', () => updateQuestionOptions(addQ1, addQ2));
    addQ2.addEventListener('change', () => updateQuestionOptions(addQ1, addQ2));
    editQ1.addEventListener('change', () => updateQuestionOptions(editQ1, editQ2));
    editQ2.addEventListener('change', () => updateQuestionOptions(editQ1, editQ2));
}

function updateQuestionOptions(q1, q2) {
    const q1Value = q1.value;

    Array.from(q2.options).forEach(option => {
        if (option.value === q1Value && option.value !== '') {
            option.disabled = true;
        } else {
            option.disabled = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', populateSecurityQuestions);

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
    document.getElementById('edit-password').value = ''; // Clear password field

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

document.getElementById('add-user-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const payload = {
        full_name: document.getElementById('add-full_name').value,
        email: document.getElementById('add-email').value,
        role: document.getElementById('add-role').value,
        password: document.getElementById('add-password').value,
        security_questions: [
            {
                question: document.getElementById('add-security-question-1').value,
                answer: document.getElementById('add-security-answer-1').value
            },
            {
                question: document.getElementById('add-security-question-2').value,
                answer: document.getElementById('add-security-answer-2').value
            }
        ]
    };

    // Add brand_name only if role is vendor
    if (payload.role === 'vendor') {
        const brandName = document.getElementById('add-brand_name').value;
        if (!brandName || brandName.trim() === '') {
            showInfoMessage('Brand name is required for vendors.', 'error');
            return;
        }
        payload.brand_name = brandName;
    }

    for (let i = 1; i <= 2; i++) {
        const q = document.getElementById(`add-security-question-${i}`).value;
        const a = document.getElementById(`add-security-answer-${i}`).value.trim();
        if (!q || !a) {
            showInfoMessage(`Please select and answer Security Question ${i}`, 'error');
            return;
        }
    }


    try {
        const response = await fetch('/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showInfoMessage('User added successfully!', 'success');
            closeAddModal();
            // Clear form
            document.getElementById('add-user-form').reset();
            // Hide brand name field if it was shown
            document.getElementById('brand-name-container').style.display = 'none';
            setTimeout(() => location.reload(), 3000); // Give time for message to show
        } else {
            const error = await response.json();
            showInfoMessage(error.message || 'Failed to add user.', 'error');
        }
    } catch (err) {
        console.error(err);
        showInfoMessage('An error occurred while adding user.', 'error');
    }
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

    // Add password only if it's not empty
    const password = document.getElementById('edit-password').value;
    if (password.trim() !== '') {
        payload.password = password;
    }

    // Add security questions and answers
    payload.security_questions = [
        {
            question: document.getElementById('edit-security-question-1').value,
            answer: document.getElementById('edit-security-answer-1').value
        },
        {
            question: document.getElementById('edit-security-question-2').value,
            answer: document.getElementById('edit-security-answer-2').value
        }
    ];

    // Remove brand_name if not vendor
    if (payload.role !== 'vendor') {
        delete payload.brand_name;
    }

    for (let i = 1; i <= 2; i++) {
        const q = document.getElementById(`edit-security-question-${i}`).value;
        const a = document.getElementById(`edit-security-answer-${i}`).value.trim();
        if (!q || !a) {
            showInfoMessage(`Please select and answer Security Question ${i}`, 'error');
            return;
        }
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
    const brandNameInput = container.querySelector('input[type="text"]');
    
    if (role === 'vendor') {
        container.style.display = 'block';
        if (brandNameInput) {
            brandNameInput.required = true;
        }
    } else {
        container.style.display = 'none';
        if (brandNameInput) {
            brandNameInput.required = false;
            brandNameInput.value = '';
        }
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
        tr.setAttribute('data-user-id-display', user.user_id || '');
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