const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

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
router.post('/', courseController.createCourse);

// Update
router.put('/:id', courseController.updateCourse);

// Delete
router.delete('/:id', courseController.deleteCourse);

// Publish/unpublish
router.put('/:id/publish', courseController.publishCourse);

module.exports = router;
