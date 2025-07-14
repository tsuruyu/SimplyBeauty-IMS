const { getVendorProducts } = require('./productController');
const { getUsers, getProducts } = require('./adminController');

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

    printDebug(user);

    res.render('user/product_table', {
        u: user,
        currentPath: tokenizePath(req.path)
    });
}

// GET /vendor_dashboard - for vendors
async function getVendorDashboard(req, res) {
    const user = req.session.user;

    if (user.role !== 'vendor') {
        return res.status(403).send("Access denied.");
    }

    try {
        const products = await getVendorProducts(user);
        printDebug(user, products);
        res.render('vendor/product_dashboard', {
            u: user,
            p: products,
            currentPath: tokenizePath(req.path)
        });
    } catch (error) {
        console.error("Failed to load vendor dashboard:", error);
        res.status(500).send("Server error loading vendor dashboard.");
    }
}

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

async function printDebug(user) {
    console.log(user.role + ' logged in:', {
        user_id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role
    });
}

async function printDebug(user, product) {
    console.log(user.role + ' logged in:', {
        user_id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        brand_name: user.brand_name
    });

    if (product != null) {
        console.log(product);
    }
    else {
        console.log("Product is empty.");
    }
}

function tokenizePath(path) {
    return path.split('/')[2] || '';
}

module.exports = {
    requireLogin,
    getUserDashboard,
    getVendorDashboard,
    getAdminDashboard
};
