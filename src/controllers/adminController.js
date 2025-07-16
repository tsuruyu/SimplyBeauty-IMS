const User = require('../models/User');
const Product = require('../models/Product');
const ProductStorage = require('../models/ProductStorage');

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

async function updateUser(req, res) {
    try {
        const userId = req.params.id;
        const { full_name, email, role, brand_name } = req.body;

        // Prepare update object dynamically
        const updateData = {
            full_name,
            email,
            role,
        };

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


module.exports = {
    getUsers,
    getProducts,
    updateUser,
    deleteUserById,
    filterUsersByRole,
    getAllUsers
};
