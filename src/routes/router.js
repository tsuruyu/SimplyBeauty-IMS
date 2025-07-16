const express = require('express');
const path = require('path');
const router = express.Router();

const { getLoginPage, handleLoginRequest } = require('../controllers/loginController');
const { requireLogin, getUserDashboard, 
        getVendorDashboard, getVendorTable, updateProduct, deleteProductById, 
        getAdminDashboard } = require('../controllers/userController');
const { updateUser, deleteUserById } = require('../controllers/adminController'); 

router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/login', getLoginPage);
router.post('/login', handleLoginRequest);

// router.get('/user/profile', requireLogin, getUserDashboard);
router.get('/user/manage_products', requireLogin, getUserDashboard);

// router.get('/vendor/profile', requireLogin, getVendorDashboard);
router.get('/vendor/product_dashboard', requireLogin, getVendorDashboard);
router.get('/vendor/product_table', requireLogin, getVendorTable);
router.put('/vendor/product/:id', requireLogin, updateProduct);
router.delete('/vendor/product/:id', requireLogin, deleteProductById);
// router.get('/vendor/sales_reports', requireLogin, getVendorDashboard);

router.get('/admin/manage_users', requireLogin, getAdminDashboard);
router.put('/admin/users/:id', requireLogin, updateUser);
router.delete('/admin/users/:id', requireLogin, deleteUserById);
// router.get('/admin/manage_products', requireLogin, getProductDashboard);

module.exports = router;