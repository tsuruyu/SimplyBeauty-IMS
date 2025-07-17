const express = require('express');
const path = require('path');
const router = express.Router();

const { getLoginPage, handleLoginRequest } = require('../controllers/loginController');
const { requireLogin, getUserDashboard } = require('../controllers/userController');
const { getVendorDashboard, getVendorTable } = require('../controllers/vendorController'); 
const { getAdminUserDashboard, getAdminProductDashboard,
        updateUser, deleteUserById, filterUsersByRole, 
        getAllUsers, createUser } = require('../controllers/adminController'); 
const { createProduct, updateProduct, deleteProductById } = require('../controllers/productController')

router.get('/', (req, res) => {
    res.redirect('/login');
});


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

module.exports = router;