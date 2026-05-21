const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { requireCourseOwnership } = require('../middlewares/ownershipMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { createSectionSchema, updateSectionSchema, reorderSectionsSchema } = require('../validators/sectionValidators');

router.get('/course/:courseId', verifyToken, sectionController.getSectionsByCourse);
router.post('/', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('section'), validate(createSectionSchema), sectionController.createSection);
router.put('/reorder', verifyToken, requireRole('admin', 'instructor'), validate(reorderSectionsSchema), sectionController.reorderSections);
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('section'), validate(updateSectionSchema), sectionController.updateSection);
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('section'), sectionController.deleteSection);

module.exports = router;
