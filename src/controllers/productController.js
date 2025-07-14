const Product = require('../models/Product');

async function getVendorProducts(user) {
    if (user.role !== 'vendor') {
        console.log('Current user not a vendor, accessed getVendorProducts().');
        throw new Error('You are not a vendor.');
    }

    const brand_name = user.brand_name;

    const products = await Product.find({ brand_name }).lean();
    return products;
}

module.exports = {
    getVendorProducts
};
