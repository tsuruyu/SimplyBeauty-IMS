document.addEventListener("DOMContentLoaded", function() {
    // Elements
    const searchInput = document.querySelector('input[placeholder="Search All Items"]');
    const productGrid = document.getElementById("product-grid");
    const allProductCards = Array.from(document.querySelectorAll(".product-card"));
    const noResults = document.getElementById("no-results");
    const sortSelect = document.querySelector("select.border-gray-300");
    const itemsPerPageSelect = document.querySelector('section.flex.justify-end.items-center.mb-6 select');

    // Initialize all products as hidden
    allProductCards.forEach(card => {
        card.style.display = 'none';
    });

    // Store filtered and sorted products
    let filteredProducts = [];
    let sortedProducts = [];

    function updateProducts() {
        const query = searchInput.value.trim().toLowerCase();
        const sortOption = sortSelect.value;

        // Filter products
        filteredProducts = allProductCards.filter(card => {
            const name = card.dataset.name.toLowerCase();
            return name.includes(query);
        });

        // Sort products
        sortedProducts = [...filteredProducts].sort((a, b) => {
            const aStock = parseInt(a.querySelector('.product-stock').textContent.replace('Stock: ', '')) || 0;
            const bStock = parseInt(b.querySelector('.product-stock').textContent.replace('Stock: ', '')) || 0;
            
            switch (sortOption) {
                case "Name ↑": return a.dataset.name.localeCompare(b.dataset.name);
                case "Name ↓": return b.dataset.name.localeCompare(a.dataset.name);
                case "Stock ↑": return aStock - bStock;
                case "Stock ↓": return bStock - aStock;
                default: return 0;
            }
        });

        // Reorder DOM without clearing (maintains hidden state)
        sortedProducts.forEach(card => {
            productGrid.appendChild(card);
        });

        // Update visibility
        applyItemsPerPage();
        noResults.style.display = filteredProducts.length ? "none" : "block";
    }

    function applyItemsPerPage() {
        const selectedValue = itemsPerPageSelect.value;
        const limit = selectedValue === "All" ? filteredProducts.length : parseInt(selectedValue);

        // Hide all filtered products first
        filteredProducts.forEach(card => {
            card.style.display = 'none';
        });

        // Show only up to the limit
        sortedProducts.slice(0, limit).forEach(card => {
            card.style.display = 'flex';
        });
    }

    // Event listeners with debouncing
    let searchTimeout;
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(updateProducts, 300);
    });

    sortSelect.addEventListener("change", updateProducts);
    itemsPerPageSelect.addEventListener("change", applyItemsPerPage);

    // Initial setup
    updateProducts();
});