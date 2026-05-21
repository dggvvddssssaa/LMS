const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { markCompleteSchema, savePositionSchema } = require('../validators/progressValidators');

router.post('/mark-complete', verifyToken, validate(markCompleteSchema), progressController.markComplete);
router.post('/save-position', verifyToken, validate(savePositionSchema), progressController.savePosition);
router.get('/:courseId', verifyToken, progressController.getCourseProgress);

module.exports = router;
