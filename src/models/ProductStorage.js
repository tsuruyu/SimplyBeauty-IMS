const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productStorageSchema = new Schema({
    product_id: { type: String, ref: 'Product', required: true },
    storage_id: { type: String, ref: 'Storage', required: true },
    quantity: { type: Number, required: true, min: 0 },
    last_updated: { type: Date, default: Date.now }
});

// Add a compound unique index to ensure a product can only be in a specific storage once
productStorageSchema.index({ product_id: 1, storage_id: 1 }, { unique: true });

module.exports = mongoose.model('ProductStorage', productStorageSchema);