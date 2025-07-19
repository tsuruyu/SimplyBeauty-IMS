const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storageSchema = new Schema({
    storage_id: { 
        type: Schema.Types.ObjectId, 
        required: true, 
        unique: true,
        ref: 'Storage'
    },
    name: { type: String, required: true, unique: true },
    location: { type: String }
});

module.exports = mongoose.model('Storage', storageSchema);