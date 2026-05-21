const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { setSettingSchema } = require('../validators/settingsValidators');

router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const allSettings = await prisma.global_settings.findMany();
    const settings = {};
    allSettings.forEach(r => settings[r.key] = r.value);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requireRole('admin'), validate(setSettingSchema), async (req, res) => {
  try {
    const { key, value } = req.body;
    await prisma.global_settings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
