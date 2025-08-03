document.addEventListener('DOMContentLoaded', function() {
    const rowsPerPage = 10;
    let currentPage = 1;
    let allRows = Array.from(document.querySelectorAll('#activityTableBody tr'));
    let filteredRows = [...allRows];
    
    const tableBody = document.getElementById('activityTableBody');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const tableInfo = document.getElementById('tableInfo');
    const searchInput = document.getElementById('searchActivity');
    const actionTypeFilter = document.getElementById('actionTypeFilter');
    
    function updatePagination() {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedRows = filteredRows.slice(startIndex, endIndex);
        
        tableBody.innerHTML = '';
        
        paginatedRows.forEach(row => tableBody.appendChild(row.cloneNode(true)));
        
        const totalRows = filteredRows.length;
        const startRow = totalRows > 0 ? startIndex + 1 : 0;
        const endRow = Math.min(endIndex, totalRows);
        tableInfo.textContent = `Showing ${startRow} to ${endRow} of ${totalRows} entries`;
        
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = endIndex >= filteredRows.length;
    }
    
    function filterRows() {
        const searchTerm = searchInput.value.toLowerCase();
        const actionType = actionTypeFilter.value;
        
        filteredRows = allRows.filter(row => {
            const description = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const rowActionType = row.dataset.actionType;
            
            const matchesSearch = description.includes(searchTerm);
            const matchesActionType = actionType === 'all' || rowActionType === actionType;
            
            return matchesSearch && matchesActionType;
        });
        
        currentPage = 1;
        updatePagination();
    }
    
    searchInput.addEventListener('input', filterRows);
    actionTypeFilter.addEventListener('change', filterRows);
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });
    nextBtn.addEventListener('click', () => {
        if ((currentPage * rowsPerPage) < filteredRows.length) {
            currentPage++;
            updatePagination();
        }
    });
    
    filterRows();
});