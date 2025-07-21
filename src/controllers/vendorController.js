const Category = require('../models/Category');
const { getVendorProducts, getTotalStockByBrand, getProductCount } = require('./productController');

async function getCategories() {
    const categories = await Category.find().lean();
    return categories;
}

async function getVendorDashboard(req, res) {
    const user = req.session.user;

    if (user.role !== 'vendor') {
        return res.status(403).send("Access denied.");
    }

    try {
        const products = await getVendorProducts(user);
        res.render('vendor/product_dashboard', {
            u: user,
            p: products,
            count: await getProductCount(user.brand_name),
            stock: await getTotalStockByBrand(user.brand_name),
            currentPath: tokenizePath(req.path)
        });
    } catch (error) {
        console.error("Failed to load vendor dashboard:", error);
        res.status(500).send("Server error loading vendor dashboard.");
    }
}

async function getVendorTable(req, res) {
    const user = req.session.user;

    if (user.role !== 'vendor') {
        return res.status(403).send("Access denied.");
    }

    try {
        const products = await getVendorProducts(user);
        const categories = await getCategories();

        res.render('vendor/product_table', {
            u: user,
            p: products,
            c: categories,
            count: await getProductCount(user.brand_name),
            currentPath: tokenizePath(req.path)
        });
    } catch (error) {
        console.error("Failed to load vendor table:", error);
        res.status(500).send("Server error loading vendor table.");
    }
}

function tokenizePath(path) {
    return path.split('/')[2] || '';
}

module.exports = {
    getVendorDashboard,
    getVendorTable
}