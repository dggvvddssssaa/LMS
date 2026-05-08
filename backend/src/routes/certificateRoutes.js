const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Student: get all my certificates
router.get('/', verifyToken, certificateController.getMyCertificates);

// Student: generate certificate for a course (requires 100% progress)
router.post('/generate/:courseId', verifyToken, certificateController.generateCertificate);

// Student: get certificate for a specific course
router.get('/course/:courseId', verifyToken, certificateController.getCertificateByCourse);

// Public: view certificate by ID (for sharing)
router.get('/:id', certificateController.getCertificateById);

module.exports = router;
