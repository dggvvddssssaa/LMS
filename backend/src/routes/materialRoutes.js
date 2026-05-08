const express = require('express');
const router = express.Router();
const MaterialRepository = require('../repositories/MaterialRepository');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Get materials for a course (public for enrolled students)
router.get('/:courseId', verifyToken, async (req, res) => {
  try {
    const materials = await MaterialRepository.findByCourseId(req.params.courseId);
    res.json({ success: true, data: materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add material (admin/instructor only)
router.post('/', verifyToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const { course_id, title, file_url, file_type } = req.body;
    if (!course_id || !title || !file_url) {
      return res.status(400).json({ success: false, message: 'course_id, title, and file_url are required' });
    }
    const material = await MaterialRepository.create({ course_id, title, file_url, file_type });
    res.status(201).json({ success: true, data: material });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete material (admin/instructor only)
router.delete('/:id', verifyToken, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const result = await MaterialRepository.delete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json({ success: true, message: 'Material deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
