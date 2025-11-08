const express = require('express');
const path = require('path');
const router = express.Router();

const { getLoginPage, handleLoginRequest, handleLogoutRequest } = require('../controllers/loginController');
const { requireLogin, requireAdmin, requireEmployee, requireVendor, 
        getUserDashboard, getUserProfile } = require('../controllers/userController');
const { getVendorDashboard, getVendorTable, getVendorProfile, getSalesReport } = require('../controllers/vendorController'); 
const { getAdminUserDashboard, getAdminProductDashboard, getAdminProfile,
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
const { getSalesData, generateSalesReport, vendorSalesReport } = require('../controllers/reportController');


/**
 * API Endpoints
 */
// These endpoints are currently not secure, guarded by requireLogin which only checks for unencrypted user session role.
router.get('/api/products', requireLogin, getAllProducts);
router.post('/api/products', requireLogin, createProduct);
router.put('/api/products/:id', requireLogin, updateProduct);
router.delete('/api/products/:id', requireLogin, deleteProductById);

router.get('/api/categories', requireLogin, getCategory);
router.post('/api/categories', requireLogin, createCategory);
router.put('/api/categories/:id', requireLogin, updateCategory);
router.delete('/api/categories/:id', requireLogin, deleteCategoryById);

router.get('/api/storages', requireLogin, getAllStorages);
router.post('/api/storages', requireLogin, createStorage);
router.put('/api/storages/:id', requireLogin, updateStorage);
router.delete('/api/storages/:id', requireLogin, deleteStorageById);
router.get('/api/storages/:id', requireLogin, getStorageDetails);

router.post('/api/product-storage', requireLogin, addProductToStorage);
router.put('/api/product-storage/:id', requireLogin, updateProductInStorage);
router.delete('/api/product-storage/:id', requireLogin, removeProductFromStorage);

router.get('/api/sales', requireLogin, getSalesData);
router.get('/api/sales/report', requireLogin, generateSalesReport);

/**
 * Login/Auth Endpoints
 */
router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/login', getLoginPage);
router.post('/login', handleLoginRequest);
router.get('/logout', handleLogoutRequest);

/**
 * Vendor Endpoints
 */
router.get('/vendor/profile', requireVendor, getVendorProfile);
router.get('/vendor/product_dashboard', requireVendor, getVendorDashboard);
router.get('/vendor/product_table', requireVendor, getVendorTable);
router.get('/vendor/manage_locations', requireVendor, getLocationDashboard);
router.get('/vendor/sales_reports', requireVendor, getSalesReport);

/**
 * Employee Endpoints
 */
router.get('/user/profile', requireEmployee, getUserProfile);
router.get('/user/manage_products', requireEmployee, getUserDashboard);
router.get('/user/manage_locations', requireEmployee, getLocationDashboard);

/**
 * Admin Endpoints
 */
router.get('/admin/profile', requireAdmin, getAdminProfile);
router.get('/admin/manage_users', requireAdmin, getAdminUserDashboard);
router.post('/admin/users', requireAdmin, createUser);
router.put('/admin/users/:id', requireAdmin, updateUser);
router.delete('/admin/users/:id', requireAdmin, deleteUserById);
router.get('/admin/users/filter', requireAdmin, filterUsersByRole);
router.get('/admin/users', requireAdmin, getAllUsers);
router.get('/admin/manage_products', requireAdmin, getAdminProductDashboard);
router.get('/admin/manage_locations', requireAdmin, getLocationDashboard);


module.exports = router;