const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

// Public routes: view all dishes or view single dish
router.get('/', dishController.getAllDishes);
router.get('/:id', dishController.getDishById);

// Admin-only routes: CRUD all dishes
router.post('/', authenticate, authorizeRoles('admin'), dishController.createDish);
router.put('/:id', authenticate, authorizeRoles('admin'), dishController.updateDish);
router.patch('/:id', authenticate, authorizeRoles('admin'), dishController.updateDish);
router.delete('/:id', authenticate, authorizeRoles('admin'), dishController.deleteDish);

module.exports = router;
