const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditSchema = new Schema({
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: function() {
            // Required for all actions except generic 'guest' actions
            return !['sale', 'validation_fail', 'access_denied'].includes(this.action_type);
        }
    },
    username: {
        type: String,
        required: function() {
            // Required for sales, failed login, guest attempts
            return ['sale', 'login', 'login_failure', 'validation_fail', 'access_denied'].includes(this.action_type);
        }
    },
    action_type: {
        type: String,
        required: true,
        enum: [
            'sale',
            'product_add', 'product_update', 'product_remove',
            'stock_add', 'stock_decrease', 'stock_update', 'stock_remove',
            'login', 'login_failure', 'validation_fail', 'access_denied', 'change_password'
        ]
    },
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: function() {
            if (this.status === 'fail') return false;

            return [
                'sale',
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
    ip_address: { 
        type: String, 
        required: function() {
            // Required for login and security events
            return ['login', 'login_failure', 'validation_fail', 'access_denied'].includes(this.action_type);
        }
    },
    date: { 
        type: Date, 
        required: true, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// Indexes for faster querying
auditSchema.index({ user_id: 1, date: -1 });
auditSchema.index({ username: 1, date: -1 });
auditSchema.index({ action_type: 1, date: -1 });
auditSchema.index({ status: 1, date: -1 });
auditSchema.index({ ip_address: 1, date: -1 });

module.exports = mongoose.model('AuditLog', auditSchema);
