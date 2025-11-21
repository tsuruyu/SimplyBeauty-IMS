const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductStorage = require('../models/ProductStorage');
const AuditLogger = require('../services/auditLogger');

// ----------------------------
// GET ALL PRODUCTS
// ----------------------------
async function getAllProducts(req, res) {
    try {
        let filter = {};

        if (req.user.role === 'vendor') {
            filter.brand_name = req.user.brand_name;
        } else if (req.query.brand_name) {
            filter.brand_name = { $regex: new RegExp(req.query.brand_name, 'i') };
        }

        const products = await Product.find(filter);
        res.json(products);

    } catch (err) {
        // Log as validation_fail if appropriate, otherwise generic fail
        await AuditLogger.logAction({
            user_id: req.session.user?.id,
            username: req.session.user?.email,
            action_type: 'validation_fail',
            description: `Failed fetching products: ${err.message}`,
            status: 'fail',
            ip_address: req.ip
        });
        res.status(500).json({ message: 'Server error' });
    }
}


// ----------------------------
// GET ALL PRODUCT OBJECTS
// ----------------------------
async function getAllProductObjects(req, res) {
    try {
        const products = await Product.find().populate('category');

        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const stock = await ProductStorage.aggregate([
                    { $match: { product_id: product._id } },
                    { $group: { _id: null, total: { $sum: "$quantity" } } }
                ]);

                return {
                    ...product.toObject(),
                    stock_qty: stock.length ? stock[0].total : 0
                };
            })
        );

        return productsWithStock;

    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
}

// ----------------------------
// GET VENDOR PRODUCTS
// ----------------------------
async function getVendorProducts(req, res, user) {
    try {
        const brand_name = user.brand_name;
        const products = await Product.find({ brand_name }).populate('category');

        res.json(JSON.parse(JSON.stringify(products)));

    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
}

async function getVendorProductObjects(user) {
    try {
        const brand_name = user.brand_name;
        const products = await Product.find({ brand_name }).populate('category');

        return JSON.parse(JSON.stringify(products));
    } catch (err) {
        return [];
    }
}

// ----------------------------
// PRODUCT COUNT / STOCK
// ----------------------------
async function getProductCount(brand_name) {
    try {
        return await Product.countDocuments({ brand_name });
    } catch {
        return 0;
    }
}

async function getTotalStock() {
    try {
        const products = await Product.find({}, 'stock_qty');
        return products.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
    } catch {
        return 0;
    }
}

async function getTotalStockByBrand(brand_name) {
    try {
        const products = await Product.find({ brand_name }, 'stock_qty');
        return products.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
    } catch {
        return 0;
    }
}

// ----------------------------
// CREATE PRODUCT
// ----------------------------
async function createProduct(req, res) {
    try {
        const { user_id, name, sku, category, price, description, image_url, brand_name } = req.body;

        // Validate required fields
        if (!name || !sku || !category || !price || !brand_name) {
            await AuditLogger.logAction({
                user_id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed product creation: Missing required fields`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(400).json({ message: 'One or more fields are missing or invalid.' });
        }

        const categoryDoc = await Category.findOne({ name: category });
        if (!categoryDoc) {
            await AuditLogger.logAction({
                user_id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed product creation: Invalid category "${category}"`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(400).json({ message: 'Invalid category' });
        }

        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) {
            await AuditLogger.logAction({
                user_id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed product creation: Duplicate SKU "${sku}"`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(400).json({ message: 'SKU already exists' });
        }

        const newProduct = new Product({
            name,
            sku,
            category: categoryDoc._id,
            price: parseFloat(price),
            description: description || '',
            image_url: image_url || 'https://placehold.co/600x400',
            brand_name
        });

        await newProduct.save();

        await AuditLogger.logAction({
            user_id,
            username: req.session.user?.email,
            action_type: 'product_add',
            product_id: newProduct._id,
            new_value: newProduct.toObject(),
            description: `Product "${newProduct.name}" (SKU: ${newProduct.sku}) created`,
            status: 'success',
            ip_address: req.ip
        });

        res.status(201).json({ message: 'Product created successfully', product: newProduct });

    } catch (err) {
        await AuditLogger.logAction({
            user_id: req.body.user_id,
            username: req.session.user?.email,
            action_type: 'validation_fail',
            description: `Failed product creation: ${err.message}`,
            status: 'fail',
            ip_address: req.ip
        });
        res.status(500).json({ message: err.message || 'Failed to create product' });
    }
}

// ----------------------------
// UPDATE PRODUCT
// ----------------------------
async function updateProduct(req, res) {
    try {
        const productId = req.params.id;
        const { user_id, name, sku, category, price, description, image_url, brand_name } = req.body;

        if (!name || !sku || !category || !price) {
            await AuditLogger.logAction({
                user_id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed product update: Missing required fields for product ID "${productId}"`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(400).json({ message: 'One or more fields are missing or invalid.' });
        }

        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            await AuditLogger.logAction({
                user_id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed product update: Product not found ID "${productId}"`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(404).json({ message: 'Product not found' });
        }

        const categoryDoc = await Category.findOne({ name: category });
        if (!categoryDoc) {
            await AuditLogger.logAction({
                user_id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed product update: Invalid category "${category}"`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(400).json({ message: 'Invalid category' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { name, sku, category: categoryDoc._id, price: parseFloat(price), description, image_url, brand_name },
            { new: true, runValidators: true }
        );

        await AuditLogger.logAction({
            user_id,
            username: req.session.user?.email,
            action_type: 'product_update',
            product_id: productId,
            previous_value: currentProduct.toObject(),
            new_value: updatedProduct.toObject(),
            description: `Product "${currentProduct.name}" updated successfully`,
            status: 'success',
            ip_address: req.ip
        });

        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });

    } catch (err) {
        await AuditLogger.logAction({
            user_id: req.body.user_id,
            username: req.session.user?.email,
            action_type: 'validation_fail',
            description: `Failed product update: ${err.message}`,
            status: 'fail',
            ip_address: req.ip
        });
        res.status(500).json({ message: err.message || 'Failed to update product' });
    }
}

// ----------------------------
// DELETE PRODUCT
// ----------------------------
async function deleteProductById(req, res) {
    try {
        const productId = req.params.id;
        const { user_id } = req.body;

        const productToDelete = await Product.findById(productId);
        if (!productToDelete) {
            await AuditLogger.logAction({
                user_id,
                username: req.session.user?.email,
                action_type: 'validation_fail',
                description: `Failed product deletion: Product not found ID "${productId}"`,
                status: 'fail',
                ip_address: req.ip
            });
            return res.status(404).json({ message: 'Product not found' });
        }

        const deletedProduct = await Product.findByIdAndDelete(productId);

        await AuditLogger.logAction({
            user_id,
            username: req.session.user?.email,
            action_type: 'product_remove',
            product_id: productId,
            previous_value: productToDelete.toObject(),
            description: `Product "${productToDelete.name}" deleted successfully`,
            status: 'success',
            ip_address: req.ip
        });

        res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });

    } catch (err) {
        await AuditLogger.logAction({
            user_id: req.body.user_id,
            username: req.session.user?.email,
            action_type: 'validation_fail',
            description: `Failed product deletion: ${err.message}`,
            status: 'fail',
            ip_address: req.ip
        });
        res.status(500).json({ message: err.message || 'Failed to delete product' });
    }
}

module.exports = {
    getAllProducts,
    getAllProductObjects,
    getVendorProducts,
    getVendorProductObjects,
    getTotalStock,
    getTotalStockByBrand,
    getProductCount,
    createProduct,
    updateProduct,
    deleteProductById
};
