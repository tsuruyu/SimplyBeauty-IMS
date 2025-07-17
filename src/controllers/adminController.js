const User = require('../models/User');
const Product = require('../models/Product');
const ProductStorage = require('../models/ProductStorage');
const bcrypt = require('bcrypt');

async function getUsers() {
    const users = await User.find().lean();
    return users;
}

async function getProducts() {
    const products = await Product.find().lean();
    return products;
}

async function filterRoles(role) {
    const users = await User.find({ role: role }).lean();
    return users;
}

// GET /admin_dashboard - user view for admin
async function getAdminUserDashboard(req, res) {
    const user = req.session.user;

    if (user.role !== 'admin') {
        return res.status(403).send("Access denied.");
    }

    try {
        const users = await getUsers();
        const products = await getProducts();
        // printDebug(user, products);
        res.render('admin/user_table', {
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

async function getAdminProductDashboard(req, res) {
    const user = req.session.user;

    if (user.role !== 'admin') { // this change is so stupid LMAO
        return res.status(403).send("Access denied.");
    }

    const products = await getProducts();

    res.render('admin/product_table', {
        u: user,
        p: products,
        currentPath: tokenizePath(req.path)
    });
}

async function updateUser(req, res) {
    try {
        const userId = req.params.id;
        const { full_name, email, role, brand_name, password, user_id } = req.body;

        // Prepare update object dynamically
        const updateData = {
            full_name,
            email,
            role,
            user_id,
        };

        // Handle password update if provided
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password_hash = hashedPassword;
        }

        // Check if user_id is unique (excluding current user)
        if (user_id) {
            const existingUser = await User.findOne({ user_id: user_id, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }

        // Check if email is unique (excluding current user)
        if (email) {
            const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
        }

        if (role === 'vendor') {
            if (!brand_name || brand_name.trim() === '') {
                return res.status(400).json({ message: 'Brand name is required for vendors' });
            }
            updateData.brand_name = brand_name;
        } else {
            updateData.brand_name = undefined; // Clear it explicitly if not vendor
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
        const { user_id, full_name, email, role, brand_name, password } = req.body;

        // Validate required fields
        if (!user_id || !full_name || !email || !role || !password) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        // Check if user_id is unique
        const existingUserId = await User.findOne({ user_id: user_id });
        if (existingUserId) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if email is unique
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        // Validate role
        const validRoles = ['admin', 'vendor', 'employee'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Validate brand_name for vendors
        if (role === 'vendor') {
            if (!brand_name || brand_name.trim() === '') {
                return res.status(400).json({ message: 'Brand name is required for vendors' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object
        const userData = {
            user_id,
            full_name,
            email: email.toLowerCase(),
            password_hash: hashedPassword,
            role
        };

        // Add brand_name only for vendors
        if (role === 'vendor') {
            userData.brand_name = brand_name;
        }

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
    getProducts,
    getAdminUserDashboard,
    getAdminProductDashboard,
    updateUser,
    deleteUserById,
    filterUsersByRole,
    getAllUsers,
    createUser
};
