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

async function createNameToIdMap(Model, nameField = 'name') {
    const items = await Model.find({});
    const map = new Map();
    items.forEach(item => {
        map.set(item[nameField].toLowerCase(), item._id);
    });
    return map;
}

async function seedUsers() {
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/user.json'), 'utf-8'));
    const securityQuestionsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/security_questions.json'), 'utf-8'));

    // Map question_id → question text
    const questionMap = new Map(securityQuestionsData.map(q => [q.id, q.question]));

    const users = await Promise.all(usersData.map(async user => {
        const pwd = user.password || {};

        // Ensure password last_updated = created_at
        const createdAt = user.created_at ? new Date(user.created_at) : new Date();
        const passwordLastUpdated = pwd.last_updated ? new Date(pwd.last_updated) : createdAt;

        // Hash main password
        const hashedPasswordValue = typeof pwd.value === 'string'
            ? await bcrypt.hash(pwd.value, 10)
            : await bcrypt.hash('defaultPassword123!', 10);

        // Security Q1
        const sq1 = pwd.security_questions?.[0] || { question_id: null, answer: '' };
        const hashedAnswer1 = await bcrypt.hash(sq1.answer || '', 10);

        // Security Q2
        const sq2 = pwd.security_questions?.[1] || { question_id: null, answer: '' };
        const hashedAnswer2 = await bcrypt.hash(sq2.answer || '', 10);

        return {
            ...user,
            password: {
                value: hashedPasswordValue,
                last_updated: passwordLastUpdated,
                security_question_1: [
                    {
                        question: sq1.question_id ? questionMap.get(sq1.question_id) || '' : '',
                        answer: hashedAnswer1
                    }
                ],
                security_question_2: [
                    {
                        question: sq2.question_id ? questionMap.get(sq2.question_id) || '' : '',
                        answer: hashedAnswer2
                    }
                ]
            },
            failed_attempts: 0,
            lock_until: null,
            last_login: null,
            last_attempt: null,
            created_at: createdAt
        };
    }));

    await User.deleteMany();
    await User.insertMany(users);
    console.log(`Seeded ${users.length} users`);
}

async function seedCategories() {
    const categories = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/category.json'), 'utf-8'));
    await Category.deleteMany();
    await Category.insertMany(categories);
    console.log(`Seeded ${categories.length} categories`);
}

async function seedProducts() {
    const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/product.json'), 'utf-8'));
    const categoryMap = await createNameToIdMap(Category);

    const products = productsData.map(product => {
        const categoryId = categoryMap.get(product.category.toLowerCase());
        if (!categoryId) throw new Error(`Category not found: ${product.category}`);
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

async function seedStorage() {
    const storages = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/storage.json'), 'utf-8'));
    await Storage.deleteMany();
    await Storage.insertMany(storages);
    console.log(`Seeded ${storages.length} storage locations`);
}

async function seedProductStorage() {
    const products = await Product.find();
    const storages = await Storage.find();

    if (products.length === 0 || storages.length === 0)
        throw new Error('Need at least 1 product and 1 storage location');

    const productStorages = [];
    const existingPairs = new Set();

    while (productStorages.length < 120) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const randomStorage = storages[Math.floor(Math.random() * storages.length)];
        const pairKey = `${randomProduct._id}-${randomStorage._id}`;
        if (!existingPairs.has(pairKey)) {
            productStorages.push({
                product_id: randomProduct._id,
                storage_id: randomStorage._id,
                quantity: Math.floor(Math.random() * 101),
                last_updated: faker.date.past(1)
            });
            existingPairs.add(pairKey);
        }
    }

    await ProductStorage.deleteMany();
    const inserted = await ProductStorage.insertMany(productStorages);
    const productIds = [...new Set(inserted.map(ps => ps.product_id.toString()))];
    await Promise.all(productIds.map(id => updateProductStock(id)));

    console.log(`Seeded ${productStorages.length} product-storage relationships`);
}

async function updateProductStock(productId) {
    const totalStock = await ProductStorage.aggregate([
        { $match: { product_id: Types.ObjectId.createFromHexString(productId) } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    const newStock = totalStock.length > 0 ? totalStock[0].total : 0;
    await Product.findByIdAndUpdate(productId, { stock_qty: newStock });
}

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
