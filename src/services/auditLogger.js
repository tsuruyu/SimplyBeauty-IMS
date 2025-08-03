// services/auditLogger.js
const AuditLog = require('../models/AuditLog');

class AuditLogger {
    static async logAction({
        user_id,
        action_type,
        product_id,
        quantity,
        previous_value,
        new_value,
        description,
        status = 'pending'
    }) {
        try {
            const logEntry = new AuditLog({
                user_id,
                action_type,
                product_id,
                quantity,
                previous_value,
                new_value,
                description,
                status
            });
            
            await logEntry.save();
            return logEntry;
        } catch (error) {
            console.error('Audit logging failed:', error);
            // Consider implementing a fallback logging mechanism
        }
    }
    
    static async getLogs(filter = {}, limit = 100000) {
        return AuditLog.find(filter)
            .sort({ date: -1 })
            .limit(limit)
            .populate('user_id', 'username email')
            .populate('product_id', 'name price brand_name');
    }
}

module.exports = AuditLogger;