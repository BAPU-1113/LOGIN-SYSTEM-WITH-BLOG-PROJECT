const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

// All order routes require authentication
router.use(authenticate);

// User: CRUD their own dish orders
router.post('/', authorizeRoles('user'), orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/my-orders', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', authorizeRoles('user', 'admin'), orderController.updateMyOrder);
router.delete('/:id', authorizeRoles('user', 'admin'), orderController.deleteMyOrder);

// Chef: Update order statuses (Preparing, Out for Delivery, Delivered)
router.patch('/:id/status', authorizeRoles('chef', 'admin'), orderController.updateOrderStatus);
router.put('/:id/status', authorizeRoles('chef', 'admin'), orderController.updateOrderStatus);

module.exports = router;
