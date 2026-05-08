const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Instructors and Admins can create courses
router.post('/', verifyToken, requireRole('admin', 'instructor'), courseController.createCourse);

// Instructors (if owner) and Admins can update
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), courseController.updateCourse);

// Instructors (if owner) and Admins can delete
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), courseController.deleteCourse);

// Publish/unpublish a course
router.put('/:id/publish', verifyToken, requireRole('admin', 'instructor'), courseController.publishCourse);

module.exports = router;
