const mongoose = require('mongoose');
const AuditLog = require('../src/models/AuditLog');
const Product = require('../src/models/Product');
const Storage = require('../src/models/Storage');
const ProductStorage = require('../src/models/ProductStorage');
const faker = require('faker');

const database = require('./db');

database.connect();
generateSaleLogs();

const TRANSACTIONS = 500;

async function generateSaleLogs() {
    try {
        // Populate both product_id and storage_id with their names
        const productStorages = await ProductStorage.find()
            .populate('product_id', 'name sku')
            .populate('storage_id', 'name')
            .lean();

        if (productStorages.length === 0) {
            console.error('No product storage records found in the database');
            return;
        }

        const transactions = [];
        const usernames = ['Johndoe', 'Janedoe', 'Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi'];
        
        // 3 months range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 3);

        for (let i = 0; i < TRANSACTIONS; i++) {
            const randomStorage = faker.random.arrayElement(productStorages);
            const product = randomStorage.product_id;
            
            const maxQuantity = Math.floor(randomStorage.quantity * 0.2) || 1;
            const quantity = faker.datatype.number({ 
                min: 1, 
                max: maxQuantity > 0 ? maxQuantity : 1 
            });
            
            const randomDate = faker.date.between(startDate, endDate);
            const username = faker.random.arrayElement(usernames);
            
            transactions.push({
                username: username,
                action_type: 'sale',
                product_id: product._id,
                storage_id: randomStorage.storage_id._id, // Use the storage's ObjectId
                quantity: quantity,
                previous_value: randomStorage.quantity,
                new_value: randomStorage.quantity - quantity,
                description: `${username} bought ${quantity} units of ${product.name} (SKU: ${product.sku}) from ${randomStorage.storage_id.name}.`, // Use storage name
                status: 'success',
                date: randomDate
            });
        }

        await AuditLog.deleteMany({ action_type: 'sale' });
        await AuditLog.insertMany(transactions);
        console.log(`Successfully generated ${transactions.length} sales`);

        mongoose.disconnect();
    } catch (error) {
        console.error('Error generating sale logs:', error);
        mongoose.disconnect();
    }
}