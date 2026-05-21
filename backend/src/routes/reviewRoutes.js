const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { z } = require('zod');

const createReviewSchema = z.object({
  courseId: z.number().int().or(z.string().regex(/^\d+$/).transform(Number)),
  rating: z.number().int().min(1, 'Rating phải từ 1-5').max(5, 'Rating phải từ 1-5'),
  comment: z.string().max(1000).optional()
});

const updateReviewSchema = z.object({
  courseId: z.number().int().or(z.string().regex(/^\d+$/).transform(Number)),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional()
});

router.get('/course/:courseId', verifyToken, reviewController.getCourseReviews);
router.post('/', verifyToken, validate(createReviewSchema), reviewController.createReview);
router.put('/', verifyToken, validate(updateReviewSchema), reviewController.updateReview);
router.delete('/course/:courseId', verifyToken, reviewController.deleteReview);

module.exports = router;
