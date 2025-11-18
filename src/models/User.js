const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
        value: { type: String, required: true },
        last_updated: { type: Date, default: Date.now },
        security_question_1: [{
            question: { type: String, required: true },
            answer: { type: String, required: true }
        }],
        security_question_2: [{
            question: { type: String, required: true },
            answer: { type: String, required: true }
        }]
    },
    role: { type: String, required: true, enum: ['admin', 'vendor', 'employee'] },
    full_name: { type: String, required: true },
    brand_name: {
        type: String,
        required: function () { return this.role === 'vendor'; }
    },
    phone: { type: String },
    created_at: { type: Date, default: Date.now },
    
    failed_attempts: { type: Number, default: 0 },
    lock_until: { type: Date, default: null },
    last_login: { type: Date, default: null },
    last_attempt: { type: Date, default: null }
});

module.exports = mongoose.model('User', userSchema);
