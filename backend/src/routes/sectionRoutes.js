const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { requireCourseOwnership } = require('../middlewares/ownershipMiddleware');

router.get('/course/:courseId', verifyToken, sectionController.getSectionsByCourse);
router.post('/', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('section'), sectionController.createSection);
router.put('/reorder', verifyToken, requireRole('admin', 'instructor'), sectionController.reorderSections);
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('section'), sectionController.updateSection);
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('section'), sectionController.deleteSection);

module.exports = router;
