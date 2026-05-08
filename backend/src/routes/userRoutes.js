const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Get current user profile
router.get('/profile', verifyToken, userController.getProfile);

// Admin creates a user
router.post('/', verifyToken, requireRole('admin'), userController.createUser);

// Admin mapping
router.get('/', verifyToken, requireRole('admin'), userController.getAllUsers);

// Admin get user details
router.get('/:id/details', verifyToken, requireRole('admin'), userController.getUserDetails);

// Admin verifies an instructor
router.put('/:id/verify', verifyToken, requireRole('admin'), userController.verifyInstructor);

// Admin deletes a user
router.delete('/:id', verifyToken, requireRole('admin'), userController.deleteUser);

module.exports = router;
