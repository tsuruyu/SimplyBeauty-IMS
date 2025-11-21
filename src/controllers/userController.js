const { getCategoryObjects } = require('./categoryController');
const { getAllProductObjects } = require('./productController');
const { validatePasswordStrength } = require("../../public/scripts/passwordPolicy.js");
const AuditLogger = require('../services/auditLogger');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// MIDDLEWARE: REQUIRE LOGIN
function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// MIDDLEWARE: REQUIRE ROLES
function requireRoles(roles = []) {
    return async function (req, res, next) {
        const ip = req.ip;
        const sessionUser = req.session?.user;

        // No session user
        if (!sessionUser) {
            await AuditLogger.logAction({
                action_type: 'access_denied',
                username: 'guest',
                description: `${ip} attempted unauthorized access to ${req.originalUrl}`,
                status: 'fail',
                ip_address: ip
            });

            return res.redirect('/login');
        }

        const { id, email, role } = sessionUser;

        // Undefined role
        if (!role) {
            await AuditLogger.logAction({
                user_id: id,
                username: email,
                action_type: 'access_denied',
                description: `Access denied: User role undefined while accessing ${req.originalUrl}`,
                status: 'fail',
                ip_address: ip
            });

            return res.status(403).send("Access denied.");
        }

        // Role not permitted
        if (!roles.includes(role)) {
            await AuditLogger.logAction({
                user_id: id,
                username: email,
                action_type: 'access_denied',
                description: `Access denied: User with role '${role}' attempted to access ${req.originalUrl}`,
                status: 'fail',
                ip_address: ip
            });

            return res.status(403).send("Access denied.");
        }

        next();
    };
}

// GET: USER PROFILE
async function getUserProfile(req, res) {
    res.render('user/profile', {
        u: req.session.user,
        currentPath: tokenizePath(req.path)
    });
}

// GET: DASHBOARD
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

// GET: CHANGE PASSWORD PAGE
async function getChangePasswordPage(req, res) {
    const sessionUser = req.session.user;
    const role = sessionUser.role === 'employee' ? 'user' : sessionUser.role;

    if (!sessionUser || !sessionUser.role) {
        return res.redirect('/login');
    }

    // render based on user role
    return res.render(`${role}/change_password`, {
        u: sessionUser,
        currentPath: 'change_password'
    });
}


// POST: HANDLE PASSWORD CHANGE
async function handleChangePassword(req, res) {
    try {
        const { old_password, new_password, confirm_password } = req.body;
        const sessionUser = req.session.user;
        const role = sessionUser.role === 'employee' ? 'user' : sessionUser.role;

        if (!sessionUser || !sessionUser.role) {
            return res.redirect('/login');
        }

        // dynamic view path
        const viewPath = `${role}/change_password`;

        const user = await User.findById(sessionUser.id);
        if (!user) {
            await AuditLogger.logAction({
                action_type: "validation_fail",
                username: sessionUser.email,
                description: `Attempted password change but user record not found.`,
                status: "fail",
                ip_address: req.ip
            });

            return res.render(viewPath, {
                u: sessionUser,
                error: "An error occurred."
            });
        }
        
        // MINIMUM PASSWORD AGE CHECK (24 HOURS)
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (now - user.password.last_updated.getTime() < ONE_DAY) {
            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: "validation_fail",
                description: `Password change for ${user.email} denied — minimum 24 hours not passed since last change.`,
                status: "fail",
                ip_address: req.ip
            });

            return res.render(viewPath, {
                u: sessionUser,
                error: "Password cannot be changed yet. Minimum password age is 24 hours."
            });
        }

        // Prevent using old password as new password
        const isSamePassword = await bcrypt.compare(new_password, user.password.value);
        if (isSamePassword) {
            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: "validation_fail",
                description: `Password change for ${user.email} failed — new password same as old password.`,
                status: "fail",
                ip_address: req.ip
            });

            return res.render(viewPath, {
                u: sessionUser,
                error: "New password cannot be the same as your old password."
            });
        }

        // EMPTY FIELD CHECK
        if (!old_password?.trim() || !new_password?.trim() || !confirm_password?.trim()) {
            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: "validation_fail",
                description: `Password change for ${sessionUser.email} failed — one or more fields were empty.`,
                status: "fail",
                ip_address: req.ip
            });

            return res.render(viewPath, {
                u: sessionUser,
                error: "All fields are required."
            });
        }

        // OLD PASSWORD VALIDATION
        const oldMatch = await bcrypt.compare(old_password, user.password.value);
        if (!oldMatch) {
            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: "validation_fail",
                description: `Old password for ${sessionUser.email} incorrect.`,
                status: "fail",
                ip_address: req.ip
            });

            return res.render(viewPath, {
                u: sessionUser,
                error: "Old password is incorrect."
            });
        }

        // CONFIRM MATCH
        if (new_password !== confirm_password) {
            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: "validation_fail",
                description: `New password and confirmation for ${sessionUser.email} do not match.`,
                status: "fail",
                ip_address: req.ip
            });

            return res.render(viewPath, {
                u: sessionUser,
                error: "New passwords do not match."
            });
        }

        // PASSWORD POLICY CHECK
        const { valid, errors } = validatePasswordStrength(new_password);

        if (!valid) {
            await AuditLogger.logAction({
                user_id: user._id,
                username: user.email,
                action_type: "validation_fail",
                description: `Password policy violation: ${errors.join(" | ")}`,
                status: "fail",
                ip_address: req.ip
            });

            return res.render(viewPath, {
                u: sessionUser,
                error: errors.join("<br>")
            });
        }

        // SAVE NEW PASSWORD
        const hashed = await bcrypt.hash(new_password, 10);
        user.password.value = hashed;
        user.password.last_updated = new Date();
        await user.save();

        await AuditLogger.logAction({
            user_id: user._id,
            username: user.email,
            action_type: "change_password",
            description: `Password changed successfully for ${user.email} in ${req.ip}.`,
            status: "success",
            ip_address: req.ip
        });

        return res.redirect('/logout');

    } catch (err) {
        const viewPath = `${role}/change_password`;

        await AuditLogger.logAction({
            action_type: "validation_fail",
            username: req.session.user?.email || "unknown",
            description: `Unexpected error during password change: ${err.message}`,
            status: "fail",
            ip_address: req.ip
        });

        return res.render(viewPath, {
            u: req.session.user,
            error: "An unexpected error occurred."
        });
    }
}

function tokenizePath(path) {
    return path.split('/')[2] || '';
}

module.exports = {
    requireLogin,
    requireRoles,
    getUserProfile,
    getUserDashboard,
    getChangePasswordPage,
    handleChangePassword
};
