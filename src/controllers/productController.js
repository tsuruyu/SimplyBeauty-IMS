const Product = require('../models/Product');

async function addProduct() {
    
}

async function getVendorProducts(user) {
    const brand_name = user.brand_name;

    const products = await Product.find({ brand_name }).lean();
    return products;
}

async function getProductCount(brand_name) {
    return await Product.countDocuments({ brand_name });
}

async function getTotalStock() {
    const products = await Product.find({}, 'stock_qty');
    const quantity = products.map(doc => doc.stock_qty);
    const totalStock = quantity.reduce((sum, qty) => sum + qty, 0);

    return totalStock;
}

async function getTotalStockByBrand(brand_name) {
    const products = await Product.find({ brand_name: brand_name }, 'stock_qty');
    const total = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
    
    return total;
}

module.exports = {
    getVendorProducts,
    getTotalStock,
    getTotalStockByBrand,
    getProductCount
};
