const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, requireRole, optionalAuth } = require('../middlewares/authMiddleware');
const { validate, validateQuery } = require('../middlewares/validateMiddleware');
const { createCourseSchema, updateCourseSchema, courseFilters } = require('../validators/courseValidators');

// Public routes — optionalAuth parses token if present (for draft visibility check)
router.get('/', validateQuery(courseFilters), courseController.getAllCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);
router.get('/:id/learning-outline', verifyToken, courseController.getLearningOutline);

// Instructors and Admins can create courses
router.post('/', verifyToken, requireRole('admin', 'instructor'), validate(createCourseSchema), courseController.createCourse);

// Instructors (if owner) and Admins can update
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), validate(updateCourseSchema), courseController.updateCourse);

// Instructors (if owner) and Admins can delete
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), courseController.deleteCourse);

// Publish/unpublish a course
router.put('/:id/publish', verifyToken, requireRole('admin', 'instructor'), courseController.publishCourse);

module.exports = router;
