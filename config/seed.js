const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const faker = require('faker');
const { Types } = mongoose;

const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const ProductStorage = require('../src/models/ProductStorage');
const Storage = require('../src/models/Storage');

const database = require('./db');

dotenv.config();
database.connect();

// Helper function to create case-insensitive name to ID mapping
async function createNameToIdMap(Model, nameField = 'name') {
    const items = await Model.find({});
    const map = new Map();
    items.forEach(item => {
        map.set(item[nameField].toLowerCase(), item._id);
    });
    return map;
}

// Seed users
async function seedUsers() {
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/user.json'), 'utf-8'));
    const users = await Promise.all(usersData.map(async user => {
        return {
            ...user,
            password_hash: user.password_hash ? await bcrypt.hash(user.password_hash, 10) : undefined,
        };
    }));

    await User.deleteMany();
    await User.insertMany(users);
    console.log(`Seeded ${users.length} users`);
}

// Seed categories
async function seedCategories() {
    const categories = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/category.json'), 'utf-8'));
    await Category.deleteMany();
    await Category.insertMany(categories);
    console.log(`Seeded ${categories.length} categories`);
}

// Seed products with category references
async function seedProducts() {
    const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/product.json'), 'utf-8'));
    const categoryMap = await createNameToIdMap(Category);

    const products = productsData.map(product => {
        const categoryId = categoryMap.get(product.category.toLowerCase());
        if (!categoryId) {
            throw new Error(`Category not found: ${product.category}`);
        }

        return {
            ...product,
            category: categoryId,
            created_at: product.created_at ? new Date(product.created_at) : new Date()
        };
    });

    await Product.deleteMany();
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
}

// Seed storage locations
async function seedStorage() {
    const storages = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/storage.json'), 'utf-8'));
    await Storage.deleteMany();
    await Storage.insertMany(storages);
    console.log(`Seeded ${storages.length} storage locations`);
}

// Seed product-storage relationships
// Seed product-storage relationships (randomized)
async function seedProductStorage() {
    // First get all products and storages
    const products = await Product.find();
    const storages = await Storage.find();

    if (products.length === 0 || storages.length === 0) {
        throw new Error('Need at least 1 product and 1 storage location to create relationships');
    }

    // Generate 120 random product-storage relationships
    const productStorages = [];
    const existingPairs = new Set(); // To avoid duplicates

    while (productStorages.length < 120) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const randomStorage = storages[Math.floor(Math.random() * storages.length)];
        
        // Create a unique key for this product-storage pair
        const pairKey = `${randomProduct._id}-${randomStorage._id}`;

        // Only add if this pair doesn't already exist
        if (!existingPairs.has(pairKey)) {
            productStorages.push({
                product_id: randomProduct._id,
                storage_id: randomStorage._id,
                quantity: Math.floor(Math.random() * 101), // 0-100
                last_updated: faker.date.past(1) // Random date in the past year
            });
            existingPairs.add(pairKey);
        }
    }

    await ProductStorage.deleteMany();
    const inserted = await ProductStorage.insertMany(productStorages);
    
    // Update stock quantities for all affected products
    const productIds = [...new Set(inserted.map(ps => ps.product_id.toString()))];
    await Promise.all(productIds.map(id => updateProductStock(id)));

    console.log(`Seeded ${productStorages.length} randomized product-storage relationships`);
}

// Reuse the same update function from the model
async function updateProductStock(productId) {
    const totalStock = await ProductStorage.aggregate([
        { $match: { product_id: Types.ObjectId.createFromHexString(productId) } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    
    const newStock = totalStock.length > 0 ? totalStock[0].total : 0;
    
    await Product.findByIdAndUpdate(productId, { 
        stock_qty: newStock 
    });
}

// Main seeding function
async function main() {
    try {
        console.time('Seeding completed in');
        await seedUsers();
        await seedCategories();
        await seedProducts();
        await seedStorage();
        await seedProductStorage();
        console.timeEnd('Seeding completed in');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

main();