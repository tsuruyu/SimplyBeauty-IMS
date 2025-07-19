const Category = require('../models/Category');

async function createCategory() {
    try {    
        const { name } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ 
                message: 'Missing required fields (name)' 
            });
        }

        // Validate category
        const categoryExists = await Category.findOne({ name: name });
        if (!categoryExists) {
            return res.status(400).json({ 
                message: 'Category already exists!' 
            });
        }

        // Check if SKU is unique

        // Create product object
        const categoryData = {
            name
        };

        const newProduct = new Product(productData);
        await newProduct.save();

        res.status(201).json({ 
            message: 'Product created successfully',
            product: newProduct 
        });
        
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to create product' 
        });
    }
}

async function updateCategory() {
    
}