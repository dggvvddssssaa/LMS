const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { createUserSchema } = require('../validators/userValidators');
const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatar: z.string().url().optional().nullable()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự').max(255)
});

// Get current user profile
router.get('/profile', verifyToken, userController.getProfile);

// Update own profile
router.put('/profile', verifyToken, validate(updateProfileSchema), userController.updateProfile);

// Change password
router.put('/change-password', verifyToken, validate(changePasswordSchema), userController.changePassword);

// Admin creates a user
router.post('/', verifyToken, requireRole('admin'), validate(createUserSchema), userController.createUser);

// Admin mapping
router.get('/', verifyToken, requireRole('admin'), userController.getAllUsers);

// Admin get user details
router.get('/:id/details', verifyToken, requireRole('admin'), userController.getUserDetails);

// Admin verifies an instructor
router.put('/:id/verify', verifyToken, requireRole('admin'), userController.verifyInstructor);

// Admin deletes a user
router.delete('/:id', verifyToken, requireRole('admin'), userController.deleteUser);

module.exports = router;
