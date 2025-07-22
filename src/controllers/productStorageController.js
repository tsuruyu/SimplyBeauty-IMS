const ProductStorage = require('../models/ProductStorage');
const Product = require('../models/Product');
const Storage = require('../models/Storage');

function tokenizePath(path) {
    return path.split('/')[2] || '';
}

async function getLocationDashboard(req, res) {
    const user = req.session.user;

    res.render('admin/storage_management', {
        u: user,
        currentPath: tokenizePath(req.path)
    });
}

async function addProductToStorage(req, res) {
    const { product_id, storage_id, quantity } = req.body;
    
    try {
        // Check if product and storage exist
        const [product, storage] = await Promise.all([
            Product.findById(product_id),
            Storage.findById(storage_id)
        ]);
        
        if (!product || !storage) {
            return res.status(404).json({ 
                success: false,
                message: 'Product or Storage not found',
                details: {
                    productExists: !!product,
                    storageExists: !!storage
                }
            });
        }
        
        // Check if product already exists in this storage
        const existing = await ProductStorage.findOne({ product_id, storage_id });
        
        if (existing) {
            return res.status(409).json({ 
                success: false,
                message: 'Product already exists in this storage location',
                existingEntry: existing
            });
        }
        
        const newProductStorage = new ProductStorage({ 
            product_id, 
            storage_id, 
            quantity 
        });
        
        const saved = await newProductStorage.save();
        
        res.status(201).json({
            success: true,
            data: saved,
            message: 'Product added to storage successfully'
        });
    } catch (error) {
        console.error('Error adding product to storage:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to add product to storage',
            error: error.message 
        });
    }
}

async function updateProductInStorage(req, res) {
    const { id } = req.params;
    const { quantity } = req.body;
    
    try {
        const updated = await ProductStorage.findByIdAndUpdate(
            id,
            { quantity },
            { 
                new: true,
                runValidators: true 
            }
        ).populate('product_id', 'name sku');
        
        if (!updated) {
            return res.status(404).json({ 
                success: false,
                message: 'Product storage entry not found' 
            });
        }
        
        res.json({
            success: true,
            data: updated,
            message: 'Product quantity updated successfully'
        });
    } catch (error) {
        console.error('Error updating product in storage:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update product quantity',
            error: error.message 
        });
    }
}

async function removeProductFromStorage(req, res) {
    const { id } = req.params;
    
    try {
        const deleted = await ProductStorage.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false,
                message: 'Product storage entry not found' 
            });
        }
        
        res.json({
            success: true,
            data: deleted,
            message: 'Product removed from storage successfully'
        });
    } catch (error) {
        console.error('Error removing product from storage:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to remove product from storage',
            error: error.message 
        });
    }
}

module.exports = {
    getLocationDashboard,
    addProductToStorage,
    updateProductInStorage,
    removeProductFromStorage
};