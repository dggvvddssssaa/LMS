const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { createCourseSchema, updateCourseSchema, courseFilters } = require('../validators/courseValidators');

// All admin course routes require authentication + admin/instructor role
router.use(verifyToken, requireRole('admin', 'instructor'));

// Admin can list ALL courses (including drafts)
router.get('/', courseController.getAdminCourses);

// Slug endpoints (must be before /:id)
router.get('/slug/check', courseController.checkSlug);
router.post('/slug/suggest', courseController.suggestSlug);

// Admin/instructor can view any owned course detail (including drafts)
router.get('/:id', courseController.getAdminCourseById);

// Create
router.post('/', validate(createCourseSchema), courseController.createCourse);

// Update
router.put('/:id', validate(updateCourseSchema), courseController.updateCourse);

// Delete
router.delete('/:id', courseController.deleteCourse);

// Publish/unpublish
router.put('/:id/publish', courseController.publishCourse);

module.exports = router;
