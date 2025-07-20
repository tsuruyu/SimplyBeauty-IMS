const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productStorageSchema = new Schema({
    product_id: { 
        type: Schema.Types.ObjectId, 
        required: false, // temporary for now since I haven't gotten to this part yet
        ref: 'Product'
    },
    storage_id: { 
        type: Schema.Types.ObjectId, 
        required: false, 
        ref: 'Storage'
    },
    quantity: { type: Number, required: true, min: 0 },
    last_updated: { type: Date, default: Date.now }
});

// Add a compound unique index to ensure a product can only be in a specific storage once
// productStorageSchema.index({ product_id: 1, storage_id: 1 }, { unique: true });

module.exports = mongoose.model('ProductStorage', productStorageSchema);