const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Public-ish (any authenticated user)
router.get('/today', verifyToken, sessionController.getToday);

// Instructor-specific
router.get('/my-teaching', verifyToken, requireRole('admin', 'instructor'), sessionController.getMyTeaching);

// Admin-only
router.get('/active', verifyToken, requireRole('admin'), sessionController.getActiveSessions);

// CRUD
router.get('/live-class/:liveClassId', verifyToken, sessionController.getSessionsByLiveClassId);
router.post('/', verifyToken, requireRole('admin', 'instructor'), sessionController.createSession);
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), sessionController.updateSession);
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), sessionController.deleteSession);

// Lifecycle
router.put('/:id/open', verifyToken, requireRole('admin', 'instructor'), sessionController.openSession);
router.put('/:id/end', verifyToken, requireRole('admin', 'instructor'), sessionController.endSession);

module.exports = router;
