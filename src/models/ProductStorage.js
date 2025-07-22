const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Product = require('./Product');

const productStorageSchema = new Schema({
    product_id: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: 'Product'
    },
    storage_id: { 
        type: Schema.Types.ObjectId, 
        required: true, 
        ref: 'Storage'
    },
    quantity: { type: Number, required: true, min: 0 },
    last_updated: { type: Date, default: Date.now }
});

// Add compound unique index
productStorageSchema.index({ product_id: 1, storage_id: 1 }, { unique: true });

// Middleware to update product stock on changes
productStorageSchema.post('save', async function(doc) {
    await updateProductStock(doc.product_id);
});

productStorageSchema.post('remove', async function(doc) {
    await updateProductStock(doc.product_id);
});

productStorageSchema.post('findOneAndUpdate', async function(doc) {
    if (doc) await updateProductStock(doc.product_id);
});

productStorageSchema.post('findOneAndDelete', async function(doc) {
    if (doc) await updateProductStock(doc.product_id);
});

// Helper function to update product stock
async function updateProductStock(productId) {
    const totalStock = await mongoose.model('ProductStorage').aggregate([
        { $match: { product_id: productId } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    
    const newStock = totalStock.length > 0 ? totalStock[0].total : 0;
    
    await Product.findByIdAndUpdate(productId, { 
        stock_qty: newStock 
    });
}

module.exports = mongoose.model('ProductStorage', productStorageSchema);