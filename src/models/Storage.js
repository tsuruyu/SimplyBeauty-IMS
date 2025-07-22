const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storageSchema = new Schema({
    name: { type: String, required: true, unique: true },
    location: { type: String, required: true }
});

module.exports = mongoose.model('Storage', storageSchema);