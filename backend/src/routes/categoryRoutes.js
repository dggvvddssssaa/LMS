const express = require('express');
const router = express.Router();
const CategoryRepository = require('../repositories/CategoryRepository');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const categories = await CategoryRepository.getAll();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const category = await CategoryRepository.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
