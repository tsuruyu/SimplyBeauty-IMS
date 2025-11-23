const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const AuditLogger = require('../services/auditLogger');
const { getAllProductObjects } = require('./productController');
const { getCategoryObjects } = require('./categoryController');
const { getLogs } = require('./auditController');
const { validatePasswordStrength } = require("../../public/scripts/passwordPolicy.js");
require('dotenv').config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

function validateAlphanumericMax50(fields) {
    const alphanumericRegex = /^[a-zA-Z0-9\s@._-]{1,50}$/;
    for (const [key, value] of Object.entries(fields)) {
        if (value && !alphanumericRegex.test(value)) {
            return `Invalid input for ${key}. Only alphanumeric characters and @ . _ - are allowed (max 50 chars).`;
        }
    }
    return null;
}

async function getUsers() {
    const users = await User.find({ role: { $ne: 'admin' } }).lean();
    return users;
}

async function filterRoles(role) {
    const users = await User.find({ role: role }).lean();
    return users;
}

async function getAdminProfile(req, res) {
    const user = req.session.user;

    res.render('admin/profile', {
        u: user,
        l: await getLogs(),
        currentPath: tokenizePath(req.path)
    });
}

async function getAdminUserDashboard(req, res) {
    const user = req.session.user;

    try {
        const users = await getUsers();
        res.render('admin/user_table', {
            u: user,
            users: users,
            currentPath: tokenizePath(req.path)
        });
    } catch (error) {
        res.status(500).send("Server error loading admin user dashboard.");
    }
}

async function getAdminProductDashboard(req, res) {
    const user = req.session.user;
    const products = await getAllProductObjects();
    const categories = await getCategoryObjects();

    res.render('admin/product_table', {
        u: user,
        p: products,
        c: categories,
        currentPath: tokenizePath(req.path)
    });
}

async function updateUser(req, res) {
    try {
        const userId = req.params.id;
        const { full_name, email, role, brand_name, password, security_questions } = req.body;

        if (role === 'admin') 
            return res.status(403).json({ message: 'Cannot assign admin role' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updateData = { full_name, email, role };

        // -------------------------------
        // PASSWORD UPDATE LOGIC
        // -------------------------------
        if (password && password.trim() !== "") {

            // 1. Validate password strength
            const pwCheck = validatePasswordStrength(password);
            if (!pwCheck.valid) {
                return res.status(400).json({ message: pwCheck.errors.join(" ") });
            }

            // 2. Check against current password
            const isSame = await bcrypt.compare(password, user.password.value);
            if (isSame) {
                return res.status(400).json({ message: "New password cannot be the same as old password." });
            }

            // 3. Check against password history
            if (user.password.prev_value) {
                const previous = Array.isArray(user.password.prev_value)
                    ? user.password.prev_value
                    : [user.password.prev_value];

                for (const old of previous) {
                    const reused = await bcrypt.compare(password, old);
                    if (reused) {
                        return res.status(400).json({ message: "New password cannot match any previously used password." });
                    }
                }
            }

            // 4. Hash new password
            const hashed = await bcrypt.hash(password, SALT_ROUNDS);

            // 5. Update password history (max 5)
            if (!Array.isArray(user.password.prev_value)) {
                user.password.prev_value = [];
            }
            user.password.prev_value.unshift(user.password.value);
            user.password.prev_value = user.password.prev_value.slice(0, 5);

            // 6. Assign new password
            updateData["password.value"] = hashed;
            updateData["password.last_updated"] = new Date();
        }

        // -------------------------------
        // SECURITY QUESTIONS UPDATE
        // -------------------------------
        if (security_questions?.length === 2) {
            updateData["password.security_question_1"] = [{
                question: security_questions[0].question,
                answer: await bcrypt.hash(security_questions[0].answer, SALT_ROUNDS)
            }];
            updateData["password.security_question_2"] = [{
                question: security_questions[1].question,
                answer: await bcrypt.hash(security_questions[1].answer, SALT_ROUNDS)
            }];
        }

        // -------------------------------
        // VENDOR BRAND NAME RULE
        // -------------------------------
        if (role === 'vendor') {
            if (!brand_name || brand_name.trim() === "") {
                return res.status(400).json({ message: "Brand name is required for vendors." });
            }
            updateData.brand_name = brand_name;
        } else {
            updateData.brand_name = undefined;
        }

        // Validate max char
        const validationError = validateAlphanumericMax50({
            full_name,
            email,
            brand_name
        });
        if (validationError) {
            await AuditLogger.logAction({
                user_id: req.session.user?.id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed user update: ${validationError}`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(400).json({ message: validationError });
        }

        await User.findByIdAndUpdate(userId, updateData, { runValidators: true });

        res.status(200).json({ message: 'User updated successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Failed to update user' });
    }
}


async function deleteUserById(req, res) {
    try {
        const userId = req.params.id;
        const sessionUserId = req.session.user?.id;

        if (userId === sessionUserId) {
            return res.status(403).json({ message: 'Admins cannot delete themselves' });
        }

        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user' });
    }
}

async function filterUsersByRole(req, res) {
    try {
        const { role } = req.query;
        if (!role) {
            return res.status(400).json({ message: 'Role query parameter is required' });
        }
        const users = await filterRoles(role);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to filter users by role' });
    }
}

async function getAllUsers(req, res) {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get users' });
    }
}

async function createUser(req, res) {
    try {
        const { user_id, full_name, email, role, brand_name, password, security_questions } = req.body;

        if (role === 'admin') return res.status(403).json({ message: 'Cannot assign admin role' });
        if (!full_name || !email || !role || !password)
            return res.status(400).json({ message: 'All required fields must be provided' });

        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) return res.status(400).json({ message: 'Email is already in use' });

        const validRoles = ['vendor', 'employee'];
        if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

        if (role === 'vendor' && (!brand_name || brand_name.trim() === ''))
            return res.status(400).json({ message: 'Brand name is required for vendors' });

        // ------------------------------------
        // PASSWORD POLICY CHECK
        // ------------------------------------
        const pwCheck = validatePasswordStrength(password);
        if (!pwCheck.valid) {
            return res.status(400).json({ message: pwCheck.errors.join(" ") });
        }

        // ------------------------------------
        // HASH PASSWORD
        // ------------------------------------
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // ------------------------------------
        // SECURITY QUESTIONS
        // ------------------------------------
        let secQ1 = [], secQ2 = [];
        if (security_questions?.length === 2) {
            secQ1 = [{
                question: security_questions[0].question,
                answer: await bcrypt.hash(security_questions[0].answer, SALT_ROUNDS)
            }];
            secQ2 = [{
                question: security_questions[1].question,
                answer: await bcrypt.hash(security_questions[1].answer, SALT_ROUNDS)
            }];
        }

        const newUser = new User({
            user_id,
            full_name,
            email: email.toLowerCase(),
            role,
            brand_name: role === 'vendor' ? brand_name : undefined,
            password: {
                value: hashedPassword,
                prev_value: [],          // initialize password history
                last_updated: new Date(),
                security_question_1: secQ1,
                security_question_2: secQ2
            }
        });

        // Validate alphanumeric max 50
        const validationError = validateAlphanumericMax50({
            full_name,
            email,
            brand_name
        });
        if (validationError) {
            await AuditLogger.logAction({
                user_id: req.session.user?.id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed user creation: ${validationError}`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(400).json({ message: validationError });
        }

        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Failed to create user' });
    }
}


function tokenizePath(path) {
    return path.split('/')[2] || '';
}

module.exports = {
    getUsers,
    getAdminProfile,
    getAdminUserDashboard,
    getAdminProductDashboard,
    updateUser,
    deleteUserById,
    filterUsersByRole,
    getAllUsers,
    createUser
};
