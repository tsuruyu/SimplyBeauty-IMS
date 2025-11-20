const { getCategoryObjects } = require('./categoryController')
const { getAllProductObjects } = require('./productController');
const AuditLogger = require('../services/auditLogger');

// Middleware: require user to be logged in
function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// Middleware to ensure user has a specific role
function requireRoles(roles = []) {
    return async function (req, res, next) {
        const ipAddress = req.ip;
        const sessionUser = req.session?.user;

        // Not logged in
        if (!sessionUser) {
            await AuditLogger.logAction({
                username: 'guest',
                action_type: 'access_denied',
                description: `Unauthorized access attempt to ${req.originalUrl} from IP ${ipAddress}`,
                status: 'fail',
                ip_address: ipAddress
            });

            return res.redirect('/login');
        }

        const { id, email, role } = sessionUser;

        // Role undefined
        if (!role) {
            await AuditLogger.logAction({
                user_id: id,
                username: email || 'unknown',
                action_type: 'access_denied',
                description: `Access attempt with undefined role to ${req.originalUrl} from IP ${ipAddress}`,
                status: 'fail',
                ip_address: ipAddress
            });

            return res.status(403).send("Access denied.");
        }

        // Role not allowed
        if (!roles.includes(role)) {
            await AuditLogger.logAction({
                user_id: id,
                username: email,
                action_type: 'access_denied',
                description: `Unauthorized access attempt by ${email} (role: ${role}) to ${req.originalUrl} from IP ${ipAddress}`,
                status: 'fail',
                ip_address: ipAddress
            });

            return res.status(403).send("Access denied.");
        }

        next();
    };
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


module.exports = {
    requireLogin,
    requireRoles,
    getUserProfile,
    getUserDashboard,
};
