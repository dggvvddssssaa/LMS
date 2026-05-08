const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/course/:courseId', verifyToken, qaController.getQuestions);
router.post('/question', verifyToken, qaController.postQuestion);
router.post('/answer', verifyToken, qaController.postAnswer);
router.put('/answer/:id/accept', verifyToken, qaController.acceptAnswer);

module.exports = router;
