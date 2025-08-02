const ProductStorage = require('../models/ProductStorage');
const Product = require('../models/Product');
const AuditLogger = require('../services/auditLogger');

async function saleProcess(req, res) {
    const { product_id, storage_id, quantity } = req.body;
    const user_id = req.session.user._id; // Assuming user is authenticated

    try {
        // Validate input
        if (!product_id || !storage_id || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input. Product ID, storage ID, and positive quantity are required.'
            });
        }

        // Find the product in storage
        const productStorage = await ProductStorage.findOne({ 
            product_id, 
            storage_id 
        }).populate('product_id', 'name sku');

        if (!productStorage) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in the specified storage location'
            });
        }

        // Check if enough quantity is available
        if (productStorage.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient quantity in stock',
                available: productStorage.quantity,
                requested: quantity
            });
        }

        // Store old quantity for audit log
        const oldQuantity = productStorage.quantity;

        // Update the quantity
        productStorage.quantity -= quantity;
        const updatedStorage = await productStorage.save();

        // Log the action
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'stock_decrease',
            product_id: product_id,
            storage_id: storage_id,
            old_value: oldQuantity,
            new_value: productStorage.quantity,
            description: `Decreased quantity by ${quantity} for ${productStorage.product_id.name} (SKU: ${productStorage.product_id.sku}) in storage ${storage_id}`,
            status: 'success'
        });

        res.status(200).json({
            success: true,
            message: 'Product quantity decreased successfully',
            data: {
                product: productStorage.product_id,
                remaining_quantity: updatedStorage.quantity
            }
        });

    } catch (error) {
        console.error('Error decreasing product quantity:', error);
        
        // Log failed attempt
        await AuditLogger.logAction({
            user_id: user_id,
            action_type: 'stock_decrease',
            product_id: product_id,
            storage_id: storage_id,
            description: `Failed to decrease quantity for product ${product_id}`,
            status: 'failed',
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to decrease product quantity',
            error: error.message
        });
    }
}

module.exports = {
    saleProcess
};