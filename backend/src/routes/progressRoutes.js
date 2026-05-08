const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/mark-complete', verifyToken, progressController.markComplete);
router.post('/save-position', verifyToken, progressController.savePosition);
router.get('/:courseId', verifyToken, progressController.getCourseProgress);

module.exports = router;
