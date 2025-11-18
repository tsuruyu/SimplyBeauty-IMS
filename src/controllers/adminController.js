const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { getAllProductObjects } = require('./productController');
const { getCategoryObjects } = require('./categoryController');
const { getLogs } = require('./auditController');
const bcrypt = require('bcrypt');

const securityQuestionsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../seed/security_questions.json'), 'utf-8')
);

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
        console.error("Failed to load admin user dashboard:", error);
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

        if (role === 'admin') return res.status(403).json({ message: 'Cannot assign admin role' });

        const updateData = { full_name, email, role };

        // Password update
        if (password && password.trim() !== '') {
            updateData['password.value'] = await bcrypt.hash(password, 10);
            updateData['password.last_updated'] = new Date();
        }

        // Security questions update
        if (security_questions?.length === 2) {
            updateData['password.security_question_1'] = [{
                question: security_questions[0].question,
                answer: await bcrypt.hash(security_questions[0].answer, 10)
            }];
            updateData['password.security_question_2'] = [{
                question: security_questions[1].question,
                answer: await bcrypt.hash(security_questions[1].answer, 10)
            }];
        }

        if (role === 'vendor') {
            if (!brand_name || brand_name.trim() === '') return res.status(400).json({ message: 'Brand name is required for vendors' });
            updateData.brand_name = brand_name;
        } else {
            updateData.brand_name = undefined;
        }

        await User.findByIdAndUpdate(userId, updateData, { runValidators: true });

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update error:', error);
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
        console.error('Delete error:', error);
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
        console.error('Filter users by role error:', error);
        res.status(500).json({ message: 'Failed to filter users by role' });
    }
}

async function getAllUsers(req, res) {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Failed to get users' });
    }
}

async function createUser(req, res) {
    try {
        const { user_id, full_name, email, role, brand_name, password, security_questions } = req.body;

        if (role === 'admin') return res.status(403).json({ message: 'Cannot assign admin role' });
        if (!full_name || !email || !role || !password) return res.status(400).json({ message: 'All required fields must be provided' });

        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) return res.status(400).json({ message: 'Email is already in use' });

        const validRoles = ['vendor', 'employee'];
        if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

        if (role === 'vendor' && (!brand_name || brand_name.trim() === '')) {
            return res.status(400).json({ message: 'Brand name is required for vendors' });
        }

        // Hash main password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Hash security answers
        let secQ1 = [], secQ2 = [];
        if (security_questions?.length === 2) {
            secQ1 = [{ 
                question: security_questions[0].question,
                answer: await bcrypt.hash(security_questions[0].answer, 10)
            }];
            secQ2 = [{ 
                question: security_questions[1].question,
                answer: await bcrypt.hash(security_questions[1].answer, 10)
            }];
        }

        const userData = {
            user_id,
            full_name,
            email: email.toLowerCase(),
            role,
            brand_name: role === 'vendor' ? brand_name : undefined,
            password: {
                value: hashedPassword,
                security_question_1: secQ1,
                security_question_2: secQ2
            }
        };

        const newUser = new User(userData);
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Create user error:', error);
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
