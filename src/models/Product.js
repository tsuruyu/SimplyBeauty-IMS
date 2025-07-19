const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    product_id: { 
        type: Schema.Types.ObjectId, 
        required: true, 
        unique: true,
        ref: 'Product'
    },
    category_id: { 
        type: Schema.Types.ObjectId, 
        required: true, 
        ref: 'Category'
    },
    brand_name: { type: String, required: false },
    name: { type: String, required: false },
    description: { type: String },
    sku: { type: String, unique: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock_qty: { type: Number, required: true, min: 0 },
    image_url: { type: String, default: "https://placehold.co/600x400" }
});

module.exports = mongoose.model('Product', productSchema);