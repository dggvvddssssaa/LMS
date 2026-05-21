const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { postQuestionSchema, postAnswerSchema, acceptAnswerParams, reactionSchema } = require('../validators/qaValidators');

router.get('/course/:courseId', verifyToken, qaController.getQuestions);
router.post('/question', verifyToken, validate(postQuestionSchema), qaController.postQuestion);
router.post('/answer', verifyToken, validate(postAnswerSchema), qaController.postAnswer);
router.put('/answer/:id/accept', verifyToken, qaController.acceptAnswer);
router.post('/reaction', verifyToken, validate(reactionSchema), qaController.toggleReaction);

module.exports = router;
