const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, enrollmentController.enroll);
router.post('/checkout', verifyToken, enrollmentController.checkout);
router.post('/checkout/confirm', verifyToken, enrollmentController.confirmPayment);
router.get('/checkout/status/:transactionId', verifyToken, enrollmentController.checkPaymentStatus);
router.get('/receipts', verifyToken, enrollmentController.getReceipts);
router.get('/my-courses', verifyToken, enrollmentController.getMyCourses);
router.get('/check/:courseId', verifyToken, enrollmentController.checkEnrollment);

module.exports = router;
