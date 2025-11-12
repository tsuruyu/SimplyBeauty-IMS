const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'vendor', 'employee'] },
    full_name: { type: String, required: true },
    brand_name: { type: String, required: function () {
        return this.role === 'vendor';
    }},
    phone: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);