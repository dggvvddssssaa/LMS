const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { requireCourseOwnership } = require('../middlewares/ownershipMiddleware');

// Get assignments for a lesson
router.get('/lesson/:lessonId', verifyToken, assignmentController.getAssignmentsByLesson);

// Get assignments for a section
router.get('/section/:sectionId', verifyToken, assignmentController.getAssignmentsBySection);

// Get final assignment for a course
router.get('/course/:courseId/final', verifyToken, assignmentController.getFinalAssignment);

// Admin / Instructor routes
router.post('/', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('assignment'), assignmentController.createAssignment);
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('assignment'), assignmentController.updateAssignment);
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('assignment'), assignmentController.deleteAssignment);

// Student routes
router.post('/:id/submit', verifyToken, assignmentController.submitAssignment);
router.get('/:id/submission', verifyToken, assignmentController.getSubmission);

module.exports = router;
