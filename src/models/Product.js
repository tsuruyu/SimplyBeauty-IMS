const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    brand_name: { type: String },
    name: { type: String, required: true },
    description: { type: String },
    sku: { type: String, unique: true },
    category: {
        type: Schema.Types.ObjectId, 
        required: true,
        ref: 'Category'
    },
    price: { type: Number, required: true, min: 0 },
    stock_qty: { type: Number, required: true, min: 0 },
    image_url: { type: String, default: "https://placehold.co/600x400" }
});

module.exports = mongoose.model('Product', productSchema);