const express = require('express');
const path = require('path');
const router = express.Router();

const { getLoginPage, handleLoginRequest } = require('../controllers/loginController');
const { requireLogin, getUserDashboard, getVendorDashboard, getAdminDashboard } = require('../controllers/userController');

router.get('/', getLoginPage);
router.post('/login', handleLoginRequest);

// router.get('/user/profile', requireLogin, getUserDashboard);
router.get('/user/manage_products', requireLogin, getUserDashboard);

// router.get('/vendor/profile', requireLogin, getVendorDashboard);
router.get('/vendor/product_dashboard', requireLogin, getVendorDashboard);
// router.get('/vendor/product_table', requireLogin, getVendorDashboard);
// router.get('/vendor/sales_reports', requireLogin, getVendorDashboard);

router.get('/admin/manage_users', requireLogin, getAdminDashboard);
// router.get('/admin/manage_products', requireLogin, getProductDashboard);

module.exports = router;