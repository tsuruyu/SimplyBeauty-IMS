const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    bg_color: { type: String, required: true, default: "bg-gray-500"  },
    text_color: { type: String, required: true, default: "bg-white-500" }
});

module.exports = mongoose.model('Category', categorySchema);