// TODO: create sale-generating script BY TOMORROW
// Deadline is in Monday, 9 AM.
// 
const mongoose = require('mongoose');
const AuditLog = require('../src/models/AuditLog');
const Product = require('../src/models/Product');
const ProductStorage = require('../src/models/ProductStorage');
const faker = require('faker');

const database = require('./db');

// Connect to MongoDB
database.connect();
generateSaleLogs();

async function generateSaleLogs() {
    try {
        // Get all products and their storage locations
        const products = await Product.find().lean();
        const productStorages = await ProductStorage.find().populate('product_id').lean();

        if (products.length === 0 || productStorages.length === 0) {
            console.error('No products or storage locations found in the database');
            return;
        }

        // Generate 500 sale transactions
        const transactions = [];
        const usernames = ['johndoe', 'janedoe', 'alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'heidi'];
        
        // Date range - last 3 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 3);

        for (let i = 0; i < 500; i++) {
            // Random product storage
            const randomStorage = faker.random.arrayElement(productStorages);
            const product = randomStorage.product_id;
            
            // Random quantity (1-20% of available stock)
            const maxQuantity = Math.floor(randomStorage.quantity * 0.2) || 1;
            const quantity = faker.datatype.number({ 
                min: 1, 
                max: maxQuantity > 0 ? maxQuantity : 1 
            });
            
            // Random date within the 3 month period
            const randomDate = faker.date.between(startDate, endDate);
            
            // Random user
            const username = faker.random.arrayElement(usernames);
            
            // Create the transaction
            transactions.push({
                username: username,
                action_type: 'sale',
                product_id: product._id,
                storage_id: randomStorage.storage_id,
                quantity: quantity,
                previous_value: randomStorage.quantity,
                new_value: randomStorage.quantity - quantity,
                description: `${username} bought ${quantity} units for ${product.name} (SKU: ${product.sku}) in storage ${randomStorage.storage_id}.`,
                status: 'success',
                date: randomDate,
                createdAt: randomDate,
                updatedAt: randomDate
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