const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { requireCourseOwnership } = require('../middlewares/ownershipMiddleware');

router.post('/', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('lesson'), lessonController.createLesson);
router.put('/reorder', verifyToken, requireRole('admin', 'instructor'), lessonController.reorderLessons);
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('lesson'), lessonController.updateLesson);
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('lesson'), lessonController.deleteLesson);

module.exports = router;
