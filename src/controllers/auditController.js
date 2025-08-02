const Audit = require('../models/AuditLog');

async function getLogs() {
    const logs = await Audit.find().sort({ date: -1 }).lean();
    return logs;
}

module.exports = {
    getLogs
}