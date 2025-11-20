// services/auditLogger.js
const AuditLog = require('../models/AuditLog');

class AuditLogger {
    /**
     * Logs any action to the AuditLog collection
     */
    static async logAction({
        user_id = null,
        username = null,
        action_type,
        product_id = null,
        quantity = null,
        previous_value = null,
        new_value = null,
        description,
        status = 'pending',
        ip_address = null
    }) {
        try {
            const logEntry = new AuditLog({
                user_id,
                username,
                action_type,
                product_id,
                quantity,
                previous_value,
                new_value,
                description,
                status,
                ip_address
            });
            await logEntry.save();
            return logEntry;
        } catch (error) {
            console.error('Audit logging failed:', error);
        }
    }

    /**
     * Retrieve logs from the database
     */
    static async getLogs(filter = {}, limit = 100) {
        return AuditLog.find(filter)
            .sort({ date: -1 })
            .limit(limit)
            .populate('user_id', 'username email')
            .populate('product_id', 'name price brand_name');
    }
}

module.exports = AuditLogger;
