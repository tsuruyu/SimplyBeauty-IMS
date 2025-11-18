const express = require('express');
const path = require('path');
const router = express.Router();

const { 
    getLoginPage, handleLoginRequest, handleLogoutRequest, getResetPasswordPage,
    getForgotPasswordPage, handleForgotPasswordRequest, verifySecurityAnswers, handleResetPassword
} = require('../controllers/loginController');
const { requireLogin, requireRoles,
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
router.get('/api/products', requireRoles(['admin', 'vendor']), getAllProducts);
router.post('/api/products', requireRoles(['admin', 'vendor']), createProduct);
router.put('/api/products/:id', requireRoles(['admin', 'vendor']), updateProduct);
router.delete('/api/products/:id', requireRoles(['admin', 'vendor']), deleteProductById);

router.get('/api/categories', requireRoles(['admin', 'vendor']), getCategory);
router.post('/api/categories', requireRoles(['admin', 'vendor']), createCategory);
router.put('/api/categories/:id', requireRoles(['admin', 'vendor']), updateCategory);
router.delete('/api/categories/:id', requireRoles(['admin', 'vendor']), deleteCategoryById);

router.get('/api/storages', requireRoles(['admin', 'vendor']), getAllStorages);
router.post('/api/storages', requireRoles(['admin', 'vendor']), createStorage);
router.put('/api/storages/:id', requireRoles(['admin', 'vendor']), updateStorage);
router.delete('/api/storages/:id', requireRoles(['admin', 'vendor']), deleteStorageById);
router.get('/api/storages/:id', requireRoles(['admin', 'vendor']), getStorageDetails);

router.post('/api/product-storage', requireRoles(['admin', 'vendor']), addProductToStorage);
router.put('/api/product-storage/:id', requireRoles(['admin', 'vendor']), updateProductInStorage);
router.delete('/api/product-storage/:id', requireRoles(['admin', 'vendor']), removeProductFromStorage);

router.get('/api/sales', requireRoles(['admin']), getSalesData);
router.get('/api/sales/report', requireRoles(['admin']), generateSalesReport);


/**
 * Login/Auth Endpoints
 */
router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/login', getLoginPage);
router.post('/login', handleLoginRequest);
router.get('/logout', handleLogoutRequest);
router.get('/forgot-password', getForgotPasswordPage);
router.post('/forgot-password', handleForgotPasswordRequest);
router.post('/verify-security', verifySecurityAnswers);
router.get('/reset_password', getResetPasswordPage);
router.post('/reset_password', handleResetPassword);

/**
 * Vendor Endpoints
 */
router.get('/vendor/profile', requireRoles(['vendor']), getVendorProfile);
router.get('/vendor/product_dashboard', requireRoles(['vendor']), getVendorDashboard);
router.get('/vendor/product_table', requireRoles(['vendor']), getVendorTable);
router.get('/vendor/manage_locations', requireRoles(['vendor']), getLocationDashboard);
router.get('/vendor/sales_reports', requireRoles(['vendor']), getSalesReport);


/**
 * Employee Endpoints
 */
router.get('/user/profile', requireRoles(['employee']), getUserProfile);
router.get('/user/manage_products', requireRoles(['employee']), getUserDashboard);
router.get('/user/manage_locations', requireRoles(['employee']), getLocationDashboard);


/**
 * Admin Endpoints
 */
router.get('/admin/profile', requireRoles(['admin']), getAdminProfile);
router.get('/admin/manage_users', requireRoles(['admin']), getAdminUserDashboard);
router.post('/admin/users', requireRoles(['admin']), createUser);
router.put('/admin/users/:id', requireRoles(['admin']), updateUser);
router.delete('/admin/users/:id', requireRoles(['admin']), deleteUserById);
router.get('/admin/users/filter', requireRoles(['admin']), filterUsersByRole);
router.get('/admin/users', requireRoles(['admin']), getAllUsers);
router.get('/admin/manage_products', requireRoles(['admin']), getAdminProductDashboard);
router.get('/admin/manage_locations', requireRoles(['admin']), getLocationDashboard);

module.exports = router;
