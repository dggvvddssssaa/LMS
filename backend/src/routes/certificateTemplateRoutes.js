const express = require('express');
const router = express.Router();
const certificateTemplateController = require('../controllers/certificateTemplateController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// All template routes require admin/instructor auth
router.use(verifyToken, requireRole('admin', 'instructor'));

router.get('/', certificateTemplateController.getAllTemplates);
router.post('/', certificateTemplateController.createTemplate);
router.get('/:id', certificateTemplateController.getTemplateById);
router.put('/:id', certificateTemplateController.updateTemplate);
router.delete('/:id', certificateTemplateController.deleteTemplate);
router.post('/:id/duplicate', certificateTemplateController.duplicateTemplate);

module.exports = router;
