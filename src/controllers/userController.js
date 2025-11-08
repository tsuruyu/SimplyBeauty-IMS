const { getCategoryObjects } = require('./categoryController')
const { getAllProductObjects } = require('./productController');

// Middleware: require user to be logged in
function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// Middleware to ensure user has a specific role
function requireRole(role) {
    return function (req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }

        const user = req.session.user;
        if (!user.role) {
            console.log("User role is undefined for user", user.id);
            return res.status(403).send("Access denied.");
        }

        if (user.role !== role) {
            console.log("Access denied for user", user.id, "with role", user.role);
            return res.status(403).send("Access denied.");
        }

        next();
    }
}

function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// GET /user/profile - for employee profile
async function getUserProfile(req, res) {
    const user = req.session.user;

    res.render('user/profile', {
        u: user,
        currentPath: tokenizePath(req.path)
    });
}

// GET /user_dashboard - for employees
async function getUserDashboard(req, res) {
    const user = req.session.user;
    const products = await getAllProductObjects();
    const categories = await getCategoryObjects();

    res.render('user/product_table', {
        u: user,
        p: products,
        c: categories,
        currentPath: tokenizePath(req.path)
    });
}

function tokenizePath(path) {
    return path.split('/')[2] || '';
}

const requireAdmin = requireRole('admin');
const requireEmployee = requireRole('employee');
const requireVendor = requireRole('vendor');

module.exports = {
    requireLogin,
    requireAdmin,
    requireEmployee,
    requireVendor,
    getUserProfile,
    getUserDashboard,
};
