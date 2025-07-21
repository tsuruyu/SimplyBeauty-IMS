const Category = require('../models/Category');

async function getCategory(req, res) {
    try {
        const categories = await Category.find().lean();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to get categories' 
        });
    }
}

async function createCategory(req, res) {
    try {    
        const { name, bg_color, text_color } = req.body;

        // Validate required fields
        if (!name || !bg_color || !text_color) {
            return res.status(400).json({ 
                message: 'One or more fields are missing or invalid.' 
            });
        }

        // Validate category doesn't already exist
        const categoryExists = await Category.findOne({ name: name });
        if (categoryExists) {
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
            category: newCategory 
        });
        
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to create category' 
        });
    }
}

async function updateCategory(req, res) {
    try {    
        const { id } = req.params;
        const { name, bg_color, text_color } = req.body;

        // Validate required fields
        if (!name || !bg_color || !text_color) {
            return res.status(400).json({ 
                message: 'One or more fields are missing or invalid.' 
            });
        }

        // Check if category exists
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ 
                message: 'Category not found!' 
            });
        }

        // Check if new name conflicts with other categories
        if (name !== category.name) {
            const nameExists = await Category.findOne({ name });
            if (nameExists) {
                return res.status(400).json({ 
                    message: 'Category name already exists!' 
                });
            }
        }

        // Update object
        const categoryData = {
            name,
            bg_color,
            text_color
        };
        
        const updatedCategory = await Category.findByIdAndUpdate(
            id, 
            categoryData, 
            { new: true, runValidators: true }
        );

        res.status(200).json({ 
            message: 'Category updated successfully',
            category: updatedCategory 
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
        const { id } = req.params;

        const deletedCategory = await Category.findByIdAndDelete(id);

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