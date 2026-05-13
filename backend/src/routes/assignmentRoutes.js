const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Get assignments for a lesson
router.get('/lesson/:lessonId', verifyToken, assignmentController.getAssignmentsByLesson);

// Get final assignment for a course
router.get('/course/:courseId/final', verifyToken, assignmentController.getFinalAssignment);

// Admin / Instructor routes
router.post('/', verifyToken, requireRole('admin', 'instructor'), assignmentController.createAssignment);
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), assignmentController.updateAssignment);
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), assignmentController.deleteAssignment);

// Student routes
router.post('/:id/submit', verifyToken, assignmentController.submitAssignment);
router.get('/:id/submission', verifyToken, assignmentController.getSubmission);

module.exports = router;
