document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector('input[placeholder="Search All Items"]');
    const productGrid = document.getElementById("product-grid");
    const productCards = document.querySelectorAll(".product-card");
    const noResults = document.getElementById("no-results");
    const sortSelect = document.querySelector("select.border-gray-300");
    const itemsPerPageSelect = document.querySelector('section.flex.justify-end.items-center.mb-6 select');

    const originalProductCards = Array.from(productCards);
    let currentProducts = Array.from(productCards);

    function filterProducts() {
        const query = searchInput.value.trim().toLowerCase();
        return originalProductCards.filter(card => {
            const name = card.dataset.name.toLowerCase();
            return name.includes(query);
        });
    }

    function updateProducts() {
        currentProducts = filterProducts();
        
        let visibleProducts = currentProducts.map(card => {
            const stockText = card.querySelector('.product-stock').textContent;
            const stockValue = parseInt(stockText.replace('Stock: ', '')) || 0;
            return {
                element: card,
                name: card.dataset.name,
                stock: stockValue
            };
        });

        const sortOption = sortSelect.value;
        visibleProducts.sort((a, b) => {
            switch (sortOption) {
                case "Name ↑": return a.name.localeCompare(b.name);
                case "Name ↓": return b.name.localeCompare(a.name);
                case "Stock ↑": return a.stock - b.stock;
                case "Stock ↓": return b.stock - a.stock;
                default: return 0;
            }
        });

        productGrid.innerHTML = '';
        visibleProducts.forEach(product => {
            productGrid.appendChild(product.element);
        });

        noResults.style.display = visibleProducts.length ? "none" : "block";
        applyItemsPerPage();
    }

    function applyItemsPerPage() {
        const selectedValue = itemsPerPageSelect.value;
        if (selectedValue === "All") {
            currentProducts.forEach(card => card.style.display = "flex");
            return;
        }
        
        const limit = parseInt(selectedValue);
        currentProducts.forEach((card, index) => {
            card.style.display = index < limit ? "flex" : "none";
        });
    }

    searchInput.addEventListener("input", updateProducts);
    sortSelect.addEventListener("change", updateProducts);
    itemsPerPageSelect.addEventListener("change", updateProducts);

    function initLowStockIndicators() {
        productCards.forEach(card => {
            const stockText = card.querySelector('.product-stock').textContent;
            const stock = parseInt(stockText.replace('Stock: ', '')) || 0;
            const lowStockMessage = card.querySelector('.low-stock-message');
            const warningIcon = card.querySelector('.warning-icon');

            if (stock < 10) {
                lowStockMessage.classList.remove('hidden');
                warningIcon.classList.remove('hidden');
            } else {
                lowStockMessage.classList.add('hidden');
                warningIcon.classList.add('hidden');
            }
        });
    }

    initLowStockIndicators();
    updateProducts();
});