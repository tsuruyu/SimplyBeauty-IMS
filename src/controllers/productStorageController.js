const ProductStorage = require('../models/ProductStorage');
const Product = require('../models/Product');
const Storage = require('../models/Storage');
const { getProductCount } = require('./productController');
const AuditLogger = require('../services/auditLogger');


function tokenizePath(path) {
    return path.split('/')[2] || '';
}

async function getLocationDashboard(req, res) {
    const user = req.session.user;
    var role = user.role;

    if (role === 'employee') {
        role = 'user';
    }

    if (role !== 'vendor') {
        res.render(`${role}/storage_management`, {
            u: user,
            currentPath: tokenizePath(req.path)
        });
    }
    else if (role === 'vendor') {
        res.render(`${role}/storage_management`, {
            u: user,
            count: await getProductCount(user.brand_name),
            currentPath: tokenizePath(req.path)
        });
    }
}

async function addProductToStorage(req, res) {
    const { user_id, product_id, storage_id, quantity } = req.body;
    // const user_id = req.session.user._id; // Get user ID from session
    
    try {
        // Check if product and storage exist
        const [product, storage] = await Promise.all([
            Product.findById(product_id),
            Storage.findById(storage_id)
        ]);
        
        if (!product || !storage) {
            // Log failed attempt
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'stock_add',
                product_id: product_id,
                status: 'fail',
                description: `Failed to add product to storage - ${!product ? 'Product not found' : ''} ${!storage ? 'Storage not found' : ''}`.trim()
            });
            
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
            // Log failed attempt due to conflict
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'stock_add',
                product_id: product_id,
                status: 'fail',
                description: `Failed to add product to storage - Product already exists in storage ${storage_id}`
            });
            
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
        
        // Log successful addition
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'stock_add',
            product_id: product_id,
            quantity: quantity,
            new_value: saved.toObject(),
            description: `Added product "${product.name}" (SKU: ${product.sku}) to storage ${storage.name}`,
            status: 'success'
        });

        res.status(201).json({
            success: true,
            data: saved,
            message: 'Product added to storage successfully'
        });
    } catch (error) {
        console.error('Error adding product to storage:', error);
        
        // Log error
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'stock_add',
            product_id: product_id,
            status: 'fail',
            description: `Error adding product to storage: ${error.message}`
        });
        
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
    const user_id = req.session.user._id;
    
    try {
        // Get the current value before updating
        const currentEntry = await ProductStorage.findById(id).populate('product_id', 'name sku').populate('storage_id', 'name');
        
        if (!currentEntry) {
            // Log failed attempt
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'stock_update',
                status: 'fail',
                description: `Failed to update product in storage - Entry not found`
            });
            
            return res.status(404).json({ 
                success: false,
                message: 'Product storage entry not found' 
            });
        }

        const updated = await ProductStorage.findByIdAndUpdate(
            id,
            { quantity },
            { 
                new: true,
                runValidators: true 
            }
        ).populate('product_id', 'name sku').populate('storage_id', 'name');
        
        // Log the update
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'stock_update',
            product_id: currentEntry.product_id._id,
            quantity: quantity,
            previous_value: {
                quantity: currentEntry.quantity,
                storage_id: currentEntry.storage_id._id,
                storage_name: currentEntry.storage_id.name
            },
            new_value: {
                quantity: updated.quantity,
                storage_id: updated.storage_id._id,
                storage_name: updated.storage_id.name
            },
            description: `Updated quantity of product "${currentEntry.product_id.name}" (SKU: ${currentEntry.product_id.sku}) in storage ${currentEntry.storage_id.name} from ${currentEntry.quantity} to ${quantity}`,
            status: 'success'
        });
        
        res.json({
            success: true,
            data: updated,
            message: 'Product quantity updated successfully'
        });
    } catch (error) {
        console.error('Error updating product in storage:', error);
        
        // Log error
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'stock_update',
            status: 'fail',
            description: `Error updating product in storage: ${error.message}`
        });
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to update product quantity',
            error: error.message 
        });
    }
}

async function removeProductFromStorage(req, res) {
    const { id } = req.params;
    const user_id = req.session.user._id;
    
    try {
        // Get the entry before deleting
        const entryToDelete = await ProductStorage.findById(id)
            .populate('product_id', 'name sku')
            .populate('storage_id', 'name');
        
        if (!entryToDelete) {
            // Log failed attempt
            await AuditLogger.logAction({
                user_id: user_id,
                action_type: 'stock_remove',
                status: 'fail',
                description: `Failed to remove product from storage - Entry not found`
            });
            
            return res.status(404).json({ 
                success: false,
                message: 'Product storage entry not found' 
            });
        }
        
        const deleted = await ProductStorage.findByIdAndDelete(id);
        
        // Log the removal
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'stock_remove',
            product_id: entryToDelete.product_id._id,
            quantity: entryToDelete.quantity,
            previous_value: entryToDelete.toObject(),
            description: `Removed product "${entryToDelete.product_id.name}" (SKU: ${entryToDelete.product_id.sku}) from storage ${entryToDelete.storage_id.name}`,
            status: 'success'
        });
        
        res.json({
            success: true,
            data: deleted,
            message: 'Product removed from storage successfully'
        });
    } catch (error) {
        console.error('Error removing product from storage:', error);
        
        // Log error
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'stock_remove',
            status: 'fail',
            description: `Error removing product from storage: ${error.message}`
        });
        
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