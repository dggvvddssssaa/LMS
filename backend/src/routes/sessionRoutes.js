const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/active', verifyToken, requireRole('admin'), sessionController.getActiveSessions);
router.get('/live-class/:liveClassId', verifyToken, sessionController.getSessionsByLiveClassId);
router.post('/', verifyToken, requireRole('admin', 'instructor'), sessionController.createSession);
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), sessionController.updateSession);
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), sessionController.deleteSession);

module.exports = router;
