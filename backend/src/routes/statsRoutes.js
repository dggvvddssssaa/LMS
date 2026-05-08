const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/dashboard', verifyToken, requireRole('admin'), statsController.getAdminDashboard);

module.exports = router;
