const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductStorage = require('../models/ProductStorage');
const AuditLogger = require('../services/auditLogger');

// In your controller file
async function getAllProducts(req, res) {
    try {
        let products;
        
        if (req.query.brand_name) {
            // Filter products by brand (case-insensitive)
            products = await Product.find({ 
                brand_name: { $regex: new RegExp(req.query.brand_name, 'i') } 
            });
        } else {
            // Get all products if no brand filter
            products = await Product.find({});
        }

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}

async function getAllProductObjects(req, res) {
    try {
        const products = await Product.find().populate('category');
        const productsWithStock = await Promise.all(products.map(async (product) => {
            const stock = await ProductStorage.aggregate([
            { $match: { product_id: product._id } },
            { $group: { _id: null, total: { $sum: "$quantity" } } }
            ]);
            return {
            ...product.toObject(),
            stock_qty: stock.length ? stock[0].total : 0 // do not remove, this computes all products and aggregates the stock quantity depending on its stock in ProductStorage
            };
        }));
        return productsWithStock;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getVendorProducts(req, res, user) {
    try {
        const brand_name = user.brand_name;
        const products = await Product.find({brand_name: brand_name}).populate('category');
        
        const safeProducts = JSON.parse(JSON.stringify(products));
        
        res.json(safeProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getVendorProductObjects(user) {
    const brand_name = user.brand_name;
    const products = await Product.find({brand_name: brand_name}).populate('category');
    
    const safeProducts = JSON.parse(JSON.stringify(products));
    
    return safeProducts;
}

async function getProductCount(brand_name) {
    return await Product.countDocuments({ brand_name });
}

async function getTotalStock() {
    const products = await Product.find({}, 'stock_qty'); // fix this and the below function soon
    const quantity = products.map(doc => doc.stock_qty);
    const totalStock = quantity.reduce((sum, qty) => sum + qty, 0);

    return totalStock;
}

async function getTotalStockByBrand(brand_name) {
    const products = await Product.find({ brand_name: brand_name }, 'stock_qty');
    const total = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
    
    return total;
}

async function createProduct(req, res) {
    try {
        const { user_id, product_id, name, sku, category, 
                price, description, image_url, brand_name } = req.body;

        // Validate required fields
        if (!name || !sku || !category || !price || !brand_name) {
            // Log failed validation attempt
            await AuditLogger.logAction({
                user_id: user_id,
                product_id: productId,
                action_type: 'product_add',
                description: `Failed product creation attempt - missing required fields`,
                status: 'fail'
            });
            return res.status(400).json({ 
                message: 'One or more fields are missing or invalid.' 
            });
        }

        // Find category by name and get its ObjectId
        const categoryDoc = await Category.findOne({ name: category });
        if (!categoryDoc) {
            // Log invalid category attempt
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'product_add',
                description: `Failed product creation - invalid category: ${category}`,
                status: 'fail'
            });
            return res.status(400).json({ 
                message: 'Invalid category' 
            });
        }

        // Check if SKU is unique
        const existingProduct = await Product.findOne({ sku: sku });
        if (existingProduct) {
            // Log duplicate SKU attempt
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'product_add',
                description: `Failed product creation - duplicate SKU: ${sku}`,
                status: 'fail'
            });
            return res.status(400).json({ message: 'SKU already exists' });
        }

        // Create product object
        const productData = {
            name,
            sku,
            category: categoryDoc._id,
            price: parseFloat(price),
            description: description || '',
            image_url: image_url || 'https://placehold.co/600x400',
            brand_name
        };

        const newProduct = new Product(productData);
        await newProduct.save();

        // Log successful creation
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'product_add',
            product_id: newProduct._id,
            new_value: newProduct.toObject(),
            description: `Product "${newProduct.name}" (SKU: ${newProduct.sku}) created`,
            status: 'success'
        });

        res.status(201).json({ 
            message: 'Product created successfully',
            product: newProduct 
        });
        
    } catch (error) {
        console.error('Create product error:', error);

        await AuditLogger.logAction({
            user_id: req.body.user_id,
            action_type: 'product_add',
            description: `Failed to create product: ${error.message}`,
            status: 'fail'
        });
        
        res.status(500).json({ 
            message: error.message || 'Failed to create product' 
        });
    }
}

async function updateProduct(req, res) {
    try {
        const productId = req.params.id;
        const { user_id, product_id, name, sku, category, 
                price, description, image_url, brand_name } = req.body;

        // Validate required fields
        if (!name || !sku || !category || !price) {
            // Log failed validation attempt
            await AuditLogger.logAction({
                user_id: user_id,
                product_id: productId,
                action_type: 'product_update',
                description: `Failed product update attempt - missing required fields for product ID: ${productId}`,
                status: 'fail'
            });
            return res.status(400).json({ 
                message: 'One or more fields are missing or invalid.' 
            });
        }

        // Get the current product state for audit logging
        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            // Log attempt to update non-existent product
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'product_update',
                description: `Failed product update - product not found: ${productId}`,
                status: 'fail'
            });
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find category by name and get its ObjectId
        const categoryDoc = await Category.findOne({ name: category });
        if (!categoryDoc) {
            // Log invalid category attempt
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'product_update',
                product_id: productId,
                description: `Failed product update - invalid category: ${category}`,
                status: 'fail'
            });
            return res.status(400).json({ 
                message: 'Invalid category' 
            });
        }

        // Prepare update object with category ObjectId
        const updateData = {
            name,
            sku,
            category: categoryDoc._id,
            price: parseFloat(price),
            description,
            image_url,
            brand_name
        };

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            // Log update failure
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'product_update',
                product_id: productId,
                description: `Failed to update product - not found after validation: ${productId}`,
                status: 'fail'
            });
            return res.status(404).json({ message: 'Product not found' });
        }

        // Log successful update with before/after values
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'product_update',
            product_id: productId,
            previous_value: currentProduct.toObject(),
            new_value: updatedProduct.toObject(),
            description: `Product "${currentProduct.name}" (SKU: ${currentProduct.sku}) updated`,
            status: 'success'
        });

        res.status(200).json({ 
            message: 'Product updated successfully',
            product: updatedProduct 
        });
    } catch (error) {
        console.error('Update error:', error);
        
        // Log update failure
        await AuditLogger.logAction({
            user_id: req.body.user_id,
            action_type: 'product_update',
            product_id: req.params.id,
            description: `Failed to update product: ${error.message}`,
            status: 'fail'
        });
        
        res.status(500).json({ 
            message: error.message || 'Failed to update product' 
        });
    }
}

async function deleteProductById(req, res) {
    try {
        const productId = req.params.id;
        const { user_id } = req.body;

        // Get the product before deletion for audit logging
        const productToDelete = await Product.findById(productId);
        if (!productToDelete) {
            // Log attempt to delete non-existent product
            await AuditLogger.logAction({
                user_id: user_id,
                product_id: productId,
                action_type: 'product_remove',
                description: `Failed product deletion - product not found: ${productId}`,
                status: 'fail'
            });
            return res.status(404).json({ message: 'Product not found' });
        }

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            // Log deletion failure
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'product_remove',
                product_id: productId,
                description: `Failed to delete product - not found after validation: ${productId}`,
                status: 'fail'
            });
            return res.status(404).json({ message: 'Product not found' });
        }

        // Log successful deletion
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'product_remove',
            product_id: productId,
            previous_value: productToDelete.toObject(),
            description: `Product "${productToDelete.name}" (SKU: ${productToDelete.sku}) deleted`,
            status: 'success'
        });

        res.status(200).json({ 
            message: 'Product deleted successfully',
            product: deletedProduct 
        });
    } catch (error) {
        console.error('Delete error:', error);
        
        // Log deletion failure
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'product_remove',
            product_id: productId,
            description: `Failed to delete product: ${error.message}`,
            status: 'fail'
        });
        
        res.status(500).json({ 
            message: error.message || 'Failed to delete product' 
        });
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
