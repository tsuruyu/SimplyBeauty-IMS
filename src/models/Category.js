const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    category_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Category', categorySchema);