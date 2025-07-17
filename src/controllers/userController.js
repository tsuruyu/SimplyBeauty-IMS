const { getProducts } = require('./productController');
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

    const products = await getProducts();

    res.render('user/product_table', {
        u: user,
        p: products,
        currentPath: tokenizePath(req.path)
    });
}

function tokenizePath(path) {
    return path.split('/')[2] || '';
}

module.exports = {
    requireLogin,
    getUserDashboard,
};
