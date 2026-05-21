const express = require('express');
const router = express.Router();
const liveClassController = require('../controllers/liveClassController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { requireCourseOwnership } = require('../middlewares/ownershipMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { createLiveClassSchema, updateLiveClassSchema } = require('../validators/liveClassValidators');

router.get('/monitor', verifyToken, requireRole('admin'), liveClassController.getMonitorRooms);
router.get('/course/:courseId', verifyToken, requireRole('admin', 'instructor'), liveClassController.getLiveClassByCourseId);
router.post('/', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('liveClass'), validate(createLiveClassSchema), liveClassController.createLiveClass);
router.get('/:id', verifyToken, liveClassController.getLiveClassDetails);

// Instructors (if owner of course) and Admins can update
router.put('/:id', verifyToken, requireRole('admin', 'instructor'), requireCourseOwnership('liveClass'), validate(updateLiveClassSchema), liveClassController.updateLiveClass);

module.exports = router;
