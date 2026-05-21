const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { requireCourseOwnership } = require('../middlewares/ownershipMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { createLessonSchema, updateLessonSchema, reorderLessonsSchema } = require('../validators/lessonValidators');

router.post('/', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('lesson'), validate(createLessonSchema), lessonController.createLesson);
router.put('/reorder', verifyToken, requireRole('admin', 'instructor'), validate(reorderLessonsSchema), lessonController.reorderLessons);
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('lesson'), validate(updateLessonSchema), lessonController.updateLesson);
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('lesson'), lessonController.deleteLesson);

module.exports = router;
