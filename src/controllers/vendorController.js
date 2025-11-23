const { getCategoryObjects } = require('./categoryController');
const { getVendorLogs } = require('./auditController')
const { getVendorProductObjects, 
        getTotalStockByBrand, getProductCount } = require('./productController');

// GET /vendor/profile - for vendor profile
async function getVendorProfile(req, res) {
    const user = req.session.user;

    res.render('vendor/profile', {
        u: user,
        l: await getVendorLogs(user.brand_name),
        currentPath: tokenizePath(req.path)
    });
}

async function getVendorDashboard(req, res) {
    const user = req.session.user;

    try {
        const products = await getVendorProductObjects(user);
        res.render('vendor/product_dashboard', {
            u: user,
            p: products,
            count: await getProductCount(user.brand_name),
            stock: await getTotalStockByBrand(user.brand_name),
            currentPath: tokenizePath(req.path)
        });
    } catch (error) {
        res.status(500).send("Server error loading vendor dashboard.");
    }
}

async function getVendorTable(req, res) {
    const user = req.session.user;

    try {
        const products = await getVendorProductObjects(user);
        const categories = await getCategoryObjects();

        res.render('vendor/product_table', {
            u: user,
            p: products,
            c: categories,
            count: await getProductCount(user.brand_name),
            currentPath: tokenizePath(req.path)
        });
    } catch (error) {
        res.status(500).send("Server error loading vendor table.");
    }
}

async function getSalesReport(req, res) {
    const user = req.session.user;

    res.render('vendor/sales_report', {
        u: user,
        count: await getProductCount(user.brand_name),
        currentPath: tokenizePath(req.path)
    });
}


function tokenizePath(path) {
    return path.split('/')[2] || '';
}

module.exports = {
    getSalesReport,
    getVendorProfile,
    getVendorDashboard,
    getVendorTable
}