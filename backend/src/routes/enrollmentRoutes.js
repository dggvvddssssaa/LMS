const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { enrollSchema, checkoutSchema, paymentStatusParams } = require('../validators/enrollmentValidators');

router.post('/', verifyToken, validate(enrollSchema), enrollmentController.enroll);
router.post('/checkout', verifyToken, validate(checkoutSchema), enrollmentController.checkout);
router.post('/checkout/confirm', verifyToken, enrollmentController.confirmPayment);
router.get('/checkout/status/:transactionId', verifyToken, enrollmentController.checkPaymentStatus);
router.get('/receipts', verifyToken, enrollmentController.getReceipts);
router.get('/my-courses', verifyToken, enrollmentController.getMyCourses);
router.get('/check/:courseId', verifyToken, enrollmentController.checkEnrollment);

module.exports = router;
