const { getProducts, getVendorProducts,
    getTotalStock,
    getTotalStockByBrand,
    getProductCount,
    createProduct,
    updateProduct,
    deleteProductById } = require('./productController');
const { getUsers } = require('./adminController');

// Middleware: require user to be logged in
function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// GET /user_dashboard - for employees
async function getUserDashboard(req, res) {
    const user = req.session.user;

    if (user.role !== 'employee') {
        return res.status(403).send("Access denied.");
    }

    const products = getProducts();

    res.render('user/product_table', {
        u: user,
        p: products,
        currentPath: tokenizePath(req.path)
    });
}

// GET /vendor_dashboard - for vendors

// GET /admin_dashboard - user view for admin
async function getAdminDashboard(req, res) {
    const user = req.session.user;

    if (user.role !== 'admin') {
        return res.status(403).send("Access denied.");
    }

    try {
        const users = await getUsers();
        const products = await getProducts();
        // printDebug(user, products);
        res.render('admin/users', {
            u: user,
            users: users,
            p: products,
            currentPath: tokenizePath(req.path)
        });
    } catch (error) {
        console.error("Failed to load vendor dashboard:", error);
        res.status(500).send("Server error loading user dashboard.");
    }
}

function tokenizePath(path) {
    return path.split('/')[2] || '';
}

module.exports = {
    requireLogin,
    getUserDashboard,
    getAdminDashboard,
};
