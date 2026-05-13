const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, requireRole, optionalAuth } = require('../middlewares/authMiddleware');

// Public routes — optionalAuth parses token if present (for draft visibility check)
router.get('/', courseController.getAllCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);

// Instructors and Admins can create courses
router.post('/', verifyToken, requireRole('admin', 'instructor'), courseController.createCourse);

// Instructors (if owner) and Admins can update
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), courseController.updateCourse);

// Instructors (if owner) and Admins can delete
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), courseController.deleteCourse);

// Publish/unpublish a course
router.put('/:id/publish', verifyToken, requireRole('admin', 'instructor'), courseController.publishCourse);

module.exports = router;
