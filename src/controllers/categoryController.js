const Category = require('../models/Category');

async function getCategory() {
    const categories = await Category.find();
    
    return categories;
}

async function createCategory() {
    try {    
        const { name, bg_color, text_color } = req.body;

        // Validate required fields
        if (!name || !bg_color || !text_color) {
            return res.status(400).json({ 
                message: 'One or more fields are missing or invalid.' 
            });
        }

        // Validate category
        const categoryExists = await Category.findOne({ name: name });
        if (!categoryExists) {
            return res.status(400).json({ 
                message: 'Category already exists!' 
            });
        }

        // Create object
        const categoryData = {
            name,
            bg_color,
            text_color
        };

        const newCategory = new Category(categoryData);
        await newCategory.save();

        res.status(201).json({ 
            message: 'Category created successfully',
            Category: newCategory 
        });
        
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to create category' 
        });
    }
}

async function updateCategory() {
    try {    
        const { name, bg_color, text_color } = req.body;

        // Validate required fields
        if (!name || !bg_color || !text_color) {
            return res.status(400).json({ 
                message: 'One or more fields are missing or invalid.' 
            });
        }

        // Validate category
        const categoryExists = await Category.findOne({ name: name });
        if (!categoryExists) {
            return res.status(400).json({ 
                message: 'Category already exists!' 
            });
        }

        // Create object
        const categoryData = {
            name,
            bg_color,
            text_color
        };
        
        const updatedProduct = await Product.findOneAndUpdate(
            { name: name }, 
            categoryData, 
            { new: true, runValidators: true }
        );

        res.status(201).json({ 
            message: 'Category created successfully',
            Category: updatedProduct 
        });
        
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to update category' 
        });
    }
}

async function deleteCategoryById(req, res) {
    try {
        const categoryId = req.params.id;

        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ 
            message: 'Category deleted successfully',
            category: deletedCategory 
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to delete category' 
        });
    }
}

module.exports = {
    getCategory,
    createCategory,
    updateCategory,
    deleteCategoryById
}