const express = require('express');
const path = require('path');
const router = express.Router();

const { getLoginPage, handleLoginRequest } = require('../controllers/loginController');
const { requireLogin, getUserDashboard, getAdminDashboard } = require('../controllers/userController');
const { getVendorDashboard, getVendorTable } = require('../controllers/vendorController'); 
const { updateUser, deleteUserById, filterUsersByRole, getAllUsers, createUser } = require('../controllers/adminController'); 
const { createProduct, updateProduct, deleteProductById } = require('../controllers/productController')

router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/login', getLoginPage);
router.post('/login', handleLoginRequest);

// router.get('/user/profile', requireLogin, getUserDashboard);
router.get('/user/manage_products', requireLogin, getUserDashboard);

// router.get('/vendor/profile', requireLogin, getVendorDashboard);
router.get('/vendor/product_dashboard', requireLogin, getVendorDashboard);
// router.post('/vendor/product_dashboard', requireLogin, createProduct);
router.get('/vendor/product_table', requireLogin, getVendorTable);
router.post('/vendor/product_table', requireLogin, createProduct);
router.put('/vendor/product/:id', requireLogin, updateProduct);
router.delete('/vendor/product/:id', requireLogin, deleteProductById);
// router.get('/vendor/sales_reports', requireLogin, getVendorDashboard);

router.get('/admin/manage_users', requireLogin, getAdminDashboard);
router.post('/admin/users', requireLogin, createUser);
router.put('/admin/users/:id', requireLogin, updateUser);
router.delete('/admin/users/:id', requireLogin, deleteUserById);
router.get('/admin/users/filter', requireLogin, filterUsersByRole);
router.get('/admin/users', requireLogin, getAllUsers);
// router.get('/admin/manage_products', requireLogin, getProductDashboard);

module.exports = router;