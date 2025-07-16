document.addEventListener("DOMContentLoaded", function () {
    // Elements
    const searchInput = document.querySelector('input[placeholder="Search All Items"]');
    const productGrid = document.getElementById("product-grid");
    const productCards = document.querySelectorAll(".product-card");
    const noResults = document.getElementById("no-results");
    const sortSelect = document.querySelector("select.border-gray-300");
    const itemsPerPageSelect = document.querySelector('section.flex.justify-end.items-center.mb-6 select');

    // Store original products
    const originalProductCards = Array.from(productCards);
    let currentProducts = Array.from(productCards);

    function updateProducts() {
        const query = searchInput.value.trim().toLowerCase();
        const sortOption = sortSelect.value;
        let visibleProducts = [];

        // Filter products
        currentProducts = originalProductCards.filter(card => {
            const name = card.dataset.name.toLowerCase();
            const matches = name.includes(query);
            card.style.display = matches ? "flex" : "none";
            return matches;
        });

        // Prepare for sorting
        visibleProducts = currentProducts.map(card => ({
            element: card,
            name: card.dataset.name,
            stock: parseInt(card.querySelector('.product-stock').textContent.replace('Stock: ', '')) || 0
        }));

        // Sort products
        visibleProducts.sort((a, b) => {
            switch (sortOption) {
                case "Name ↑": return a.name.localeCompare(b.name);
                case "Name ↓": return b.name.localeCompare(a.name);
                case "Stock ↑": return a.stock - b.stock;
                case "Stock ↓": return b.stock - a.stock;
                default: return 0;
            }
        });

        // Update DOM
        productGrid.innerHTML = '';
        visibleProducts.forEach(product => {
            productGrid.appendChild(product.element);
        });

        // Show/hide no results
        noResults.style.display = visibleProducts.length ? "none" : "block";
        applyItemsPerPage();
    }

    // Function to handle items per page selection
    function applyItemsPerPage() {
        const selectedValue = itemsPerPageSelect.value;
        if (selectedValue === "All") return;
        
        const limit = parseInt(selectedValue);
        currentProducts.forEach((card, index) => {
            card.style.display = index < limit ? "flex" : "none";
        });
    }

    // Event listeners
    searchInput.addEventListener("input", updateProducts);
    sortSelect.addEventListener("change", updateProducts);
    itemsPerPageSelect.addEventListener("change", applyItemsPerPage);

    // Initial setup
    updateProducts();
});