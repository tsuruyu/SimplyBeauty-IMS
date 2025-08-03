const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditSchema = new Schema({
    user_id: { 
        type: Schema.Types.ObjectId, 
        required: function() {
            return this.action_type !== 'sale';
        },
        ref: 'User' 
    },
    username: {
        type: String,
        required: function() {
            return this.action_type === 'sale';
        }
    },
    action_type: {
        type: String,
        required: true,
        enum: ['sale', 'generate_report',
            'product_add', 'product_update', 'product_remove', // implement this first, most important 
            'stock_add', 'stock_decrease', 'stock_update', 'stock_remove']
    },
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: function() {
            return ['sale',
                'product_add', 'product_update', 'product_remove', 
                'stock_add', 'stock_decrease', 'stock_update', 'stock_remove',
            ].includes(this.action_type);
        }
    },
    quantity: {
        type: Number,
        required: function() {
            return ['sale', 'stock_add', 'stock_decrease', 'stock_update', 'stock_remove'].includes(this.action_type);
        }
    },
    previous_value: Schema.Types.Mixed,
    new_value: Schema.Types.Mixed,
    description: { 
        type: String, 
        required: true 
    },
    status: {
        type: String,
        enum: ['success', 'fail', 'pending'],
        default: 'pending'
    },
    date: { 
        type: Date, 
        required: true, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// Index for faster querying
auditSchema.index({ user_id: 1, date: -1 });
auditSchema.index({ username: 1, date: -1 });
auditSchema.index({ action_type: 1, date: -1 });

module.exports = mongoose.model('AuditLog', auditSchema);