const mongoose = require('mongoose');
const Audit = require('../models/AuditLog');

async function getLogs() {
    const logs = await Audit.find().sort({ date: -1 }).lean();
    return logs;
}

async function getVendorLogs(brandName) {
    const logs = await Audit.find()
        .sort({ date: -1 })
        .populate('product_id', 'name price brand_name')
        .lean();

    console.log(logs);

    return logs.filter(log => 
        log.product_id?.brand_name === brandName
    );
}

module.exports = {
    getLogs,
    getVendorLogs
}