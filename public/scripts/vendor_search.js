document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector('input[placeholder="Search All Items"]');
    const productCards = document.querySelectorAll(".product-card");
    const noResults = document.getElementById("no-results");

    searchInput.addEventListener("input", function () {
        const query = this.value.trim().toLowerCase();
        let isAnyVisible = false;

        productCards.forEach(card => {
            const name = card.dataset.name.toLowerCase();

            const matches = name.includes(query);

            if (matches) {
                card.style.display = "flex";
                isAnyVisible = true;
            } else {
                card.style.display = "none";
            }

            if (!matches && card.classList.contains('expanded')) {
                toggleProductDetails(card);
            }
        });

        noResults.style.display = isAnyVisible ? "none" : "block";
    });
});
