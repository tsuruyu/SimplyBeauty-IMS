let expandedCard = null; // To keep track of the currently expanded card
const LOW_STOCK_THRESHOLD = 20; // Define your low stock threshold here

function toggleProductDetails(cardElement) {
    const productDetails = cardElement.querySelector('.product-details');
    const productStockElement = cardElement.querySelector('.product-stock');
    const warningIcon = cardElement.querySelector('.warning-icon');
    const closeButton = cardElement.querySelector('.close-button');
    const productGrid = document.getElementById('product-grid');
    const allProductCards = document.querySelectorAll('.product-card');
    const lowStockMessage = cardElement.querySelector('.low-stock-message');

    // Safely get the stock value, assuming format "Stock: X"
    const stockText = productStockElement ? productStockElement.textContent : '';
    const stockMatch = stockText.match(/Stock:\s*(\d+)/);
    const stockValue = stockMatch ? parseInt(stockMatch[1], 10) : 0;
    const isLowStock = stockValue <= LOW_STOCK_THRESHOLD;

    // This will render the warning icon immediately if stock is low
    allProductCards.forEach(card => {
        const stockElement = card.querySelector(".product-stock");
        const warningIcon = card.querySelector(".warning-icon");

        if (!stockElement || !warningIcon) return;

        const stockText = stockElement.textContent;
        const stockMatch = stockText.match(/Stock:\s*(\d+)/);
        const stockValue = stockMatch ? parseInt(stockMatch[1], 10) : 0;

        if (stockValue <= LOW_STOCK_THRESHOLD) {
            warningIcon.classList.remove("hidden");
        }
    });

    if (cardElement.classList.contains('expanded')) {
        // Card is currently expanded, so collapse it

        // Hide detailed info first (collapse height, then fade out)
        productDetails.style.maxHeight = '0';
        productDetails.style.marginTop = '0';
        productDetails.style.opacity = '0';
        productDetails.classList.add('hiding');

        // Hide low stock message if it was visible
        lowStockMessage.style.opacity = '0';
        lowStockMessage.style.maxHeight = '0';
        lowStockMessage.style.marginTop = '0';

        // Animate out the main card changes and bring back others
        setTimeout(() => {
            cardElement.classList.remove('expanded');
            productGrid.classList.remove('has-expanded-card');
            closeButton.classList.add('hidden');

            // Show stock and warning icon (if applicable)
            productStockElement.classList.remove('hidden');
            // if (warningIcon) warningIcon.classList.remove('hidden');
            productStockElement.style.opacity = '1';
            productStockElement.style.height = 'auto'; // Revert height
            productStockElement.style.marginBottom = '0.5rem'; // Revert margin

            // Revert other cards
            allProductCards.forEach(otherCard => {
                if (otherCard !== cardElement) {
                    otherCard.classList.remove('dimmed');
                    otherCard.style.pointerEvents = 'auto';
                }
            });

            // Remove hiding class after all transitions are complete
            productDetails.classList.remove('hiding');

        }, 300); // This delay should match or be slightly less than productDetails max-height transition

        expandedCard = null; // Reset expanded card tracker

    } else {
        // Collapse any previously expanded card first
        if (expandedCard && expandedCard !== cardElement) {
            toggleProductDetails(expandedCard);
        }

        // Expand the clicked card

        // Dim and disable other cards instantly for immediate feedback
        allProductCards.forEach(otherCard => {
            if (otherCard !== cardElement) {
                otherCard.classList.add('dimmed');
                otherCard.style.pointerEvents = 'none';
            }
        });

        // Add expanded classes to the main card and grid
        cardElement.classList.add('expanded');
        productGrid.classList.add('has-expanded-card');
        closeButton.classList.remove('hidden');

        // Hide original elements (stock, warning)
        productStockElement.style.opacity = '0';
        productStockElement.style.height = '0';
        productStockElement.style.marginBottom = '0';
        if (warningIcon) {
            if (isLowStock) {
                warningIcon.classList.remove('hidden'); // Show warning icon for low stock
            } else {
                warningIcon.classList.add('hidden'); // Hide it for normal stock
            }
        }


        // Show low stock message if applicable
        if (isLowStock) {
            setTimeout(() => {
                lowStockMessage.style.opacity = '1';
                lowStockMessage.style.maxHeight = lowStockMessage.scrollHeight + 'px'; // Set to actual height
                lowStockMessage.style.marginTop = '1rem';
            }, 200); // Delay for showing low stock message
        } else {
            // Ensure it's hidden if not low stock
            lowStockMessage.style.opacity = '0';
            lowStockMessage.style.maxHeight = '0';
            lowStockMessage.style.marginTop = '0';
        }

        // Animate in details with a slight delay after card has started expanding
        setTimeout(() => {
            productDetails.style.maxHeight = productDetails.scrollHeight + 'px'; // Set to actual height
            productDetails.style.marginTop = '1rem'; // Add margin
            productDetails.style.opacity = '1';
            productDetails.classList.remove('hiding'); // Ensure no hiding styles remain
        }, 200); // Start fading in details after a short delay

        expandedCard = cardElement; // Set the currently expanded card
    }
}