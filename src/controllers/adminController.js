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

module.exports = {
    getUsers,
    getProducts
};
