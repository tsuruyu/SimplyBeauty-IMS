const Product = require('../models/Product');

async function createProduct(req, res) {
    try {
        const { name, sku, category, category_id, product_id, price, stock_qty, description, image_url, brand_name } = req.body;

        // Validate required fields
        if (!name || !sku || !category || !price || stock_qty === undefined || !brand_name) {
            return res.status(400).json({ 
                message: 'Missing required fields (name, sku, category, price, stock_qty, or brand_name)' 
            });
        }

        // Validate category
        const validCategories = ['Skincare', 'Makeup', 'Haircare', 'Fragrances', 'Bodycare', 'Unassigned'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                message: 'Invalid category' 
            });
        }

        // Check if SKU is unique
        const existingProduct = await Product.findOne({ sku: sku });
        if (existingProduct) {
            return res.status(400).json({ message: 'SKU already exists' });
        }

        // Create product object
        const productData = {
            name,
            sku,
            category,
            category_id: category_id,
            product_id: product_id,
            price: parseFloat(price),
            stock_qty: parseInt(stock_qty),
            description: description || '',
            image_url: image_url || 'https://placehold.co/600x400',
            brand_name
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

async function updateProduct(req, res) {
    try {
        const productId = req.params.id;
        const { name, sku, category, price, stock_qty, description, image_url } = req.body;

        // Validate required fields
        if (!name || !sku || !category || !price || stock_qty === undefined) {
            return res.status(400).json({ 
                message: 'Missing required fields (name, sku, category, price, or stock_qty)' 
            });
        }

        // Validate category
        const validCategories = ['Skincare', 'Makeup', 'Haircare', 'Fragrances', 'Bodycare', 'Unassigned'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                message: 'Invalid category' 
            });
        }

        // Prepare update object
        const updateData = {
            name,
            sku,
            category,
            price: parseFloat(price),
            stock_qty: parseInt(stock_qty),
            description,
            image_url
        };

        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ 
            message: 'Product updated successfully',
            product: updatedProduct 
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to update product' 
        });
    }
}

async function deleteProductById(req, res) {
    try {
        const productId = req.params.id;

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ 
            message: 'Product deleted successfully',
            product: deletedProduct 
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to delete product' 
        });
    }
}

async function getProducts() {
    const products = await Product.find().lean();
    // console.log(products)
    return products;
}

async function getVendorProducts(user) {
    const brand_name = user.brand_name;

    const products = await Product.find({ brand_name }).lean();
    return products;
}

async function getProductCount(brand_name) {
    return await Product.countDocuments({ brand_name });
}

async function getTotalStock() {
    const products = await Product.find({}, 'stock_qty');
    const quantity = products.map(doc => doc.stock_qty);
    const totalStock = quantity.reduce((sum, qty) => sum + qty, 0);

    return totalStock;
}

async function getTotalStockByBrand(brand_name) {
    const products = await Product.find({ brand_name: brand_name }, 'stock_qty');
    const total = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
    
    return total;
}

module.exports = {
    getProducts,
    getVendorProducts,
    getTotalStock,
    getTotalStockByBrand,
    getProductCount,
    createProduct,
    updateProduct,
    deleteProductById
};
