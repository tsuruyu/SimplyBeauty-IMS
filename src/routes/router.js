const express = require('express');
const path = require('path');
const router = express.Router();

const { getLoginPage, handleLoginRequest } = require('../controllers/loginController');
const { requireLogin, getUserDashboard } = require('../controllers/userController');
const { getVendorDashboard, getVendorTable } = require('../controllers/vendorController'); 
const { getAdminUserDashboard, getAdminProductDashboard,
        updateUser, deleteUserById, filterUsersByRole, 
        getAllUsers, createUser } = require('../controllers/adminController'); 
const { getAllProducts, createProduct, 
        updateProduct, deleteProductById } = require('../controllers/productController')
const { getCategory, createCategory, 
        updateCategory, deleteCategoryById } = require('../controllers/categoryController')
const { getAllStorages, createStorage, updateStorage, 
        deleteStorageById, getStorageDetails } = require('../controllers/storageController');
const { getLocationDashboard, addProductToStorage, updateProductInStorage, 
        removeProductFromStorage} = require('../controllers/productStorageController');

router.get('/', (req, res) => {
    res.redirect('/login');
});


/**
 * It probably would've been much better if we used API endpoints pero we dug too deep na eh
 */
// these endpoints are currently not secure. no role/user validation
router.get('/api/categories', getCategory);
router.post('/api/categories', createCategory);
router.put('/api/categories/:id', updateCategory);
router.delete('/api/categories/:id', deleteCategoryById);

router.get('/api/storages', requireLogin, getAllStorages);
router.post('/api/storages', requireLogin, createStorage);
router.put('/api/storages/:id', requireLogin, updateStorage);
router.delete('/api/storages/:id', requireLogin, deleteStorageById);
router.get('/api/storages/:id', requireLogin, getStorageDetails);

router.get('/api/products', requireLogin, getAllProducts);

router.post('/api/product-storage', requireLogin, addProductToStorage);
router.put('/api/product-storage/:id', requireLogin, updateProductInStorage);
router.delete('/api/product-storage/:id', requireLogin, removeProductFromStorage);

/**
 * Login/Auth Endpoints
 */

router.get('/login', getLoginPage);
router.post('/login', handleLoginRequest);

/**
 * Employee Endpoints
 */

// router.get('/user/profile', requireLogin, getUserDashboard);
router.get('/user/manage_products', requireLogin, getUserDashboard);
router.post('/user/manage_products', requireLogin, createProduct);
router.put('/user/product/:id', requireLogin, updateProduct);
router.delete('/user/product/:id', requireLogin, deleteProductById);
router.get('user/manage_locations', requireLogin);


/**
 * Vendor Endpoints
 */
// router.get('/vendor/profile', requireLogin, getVendorDashboard);
router.get('/vendor/product_dashboard', requireLogin, getVendorDashboard);
router.get('/vendor/product_table', requireLogin, getVendorTable);
router.post('/vendor/product_table', requireLogin, createProduct);
router.put('/vendor/product/:id', requireLogin, updateProduct);
router.delete('/vendor/product/:id', requireLogin, deleteProductById);
// router.get('/vendor/product/filter', requireLogin, filterProductByBrand);
// router.get('/vendor/sales_reports', requireLogin, getVendorDashboard);
router.get('vendor/manage_locations', requireLogin);


/**
 * Admin Endpoints
 */
router.get('/admin/manage_users', requireLogin, getAdminUserDashboard);
router.post('/admin/users', requireLogin, createUser);
router.put('/admin/users/:id', requireLogin, updateUser);
router.delete('/admin/users/:id', requireLogin, deleteUserById);
router.get('/admin/users/filter', requireLogin, filterUsersByRole);
router.get('/admin/users', requireLogin, getAllUsers);
router.get('/admin/manage_products', requireLogin, getAdminProductDashboard);
router.post('/admin/product', requireLogin, createProduct);
router.put('/admin/product/:id', requireLogin, updateProduct);
router.delete('/admin/product/:id', requireLogin, deleteProductById);
// router.get('/admin/product/filter', requireLogin, filterProductByBrand);
router.get('/admin/manage_locations', requireLogin, getLocationDashboard);


module.exports = router;