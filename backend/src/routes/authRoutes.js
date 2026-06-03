const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');

// Temporary route to reset admin password on live db
router.get('/force-reset-admin', async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const prisma = require('../config/prisma');
    const pw = await bcrypt.hash('Admin@123', 10);
    const existing = await prisma.user.findUnique({ where: { email: 'admin@admin.com' }});
    if (existing) {
      await prisma.user.update({
        where: { email: 'admin@admin.com' },
        data: { password: pw }
      });
      res.send('<h1>Admin password reset to Admin@123</h1><a href="/">Go to login</a>');
    } else {
      await prisma.user.create({
        data: { name: 'Super Admin', email: 'admin@admin.com', password: pw, role: 'admin', is_verified: true }
      });
      res.send('<h1>Admin account created with password Admin@123</h1><a href="/">Go to login</a>');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyToken, authController.me);

module.exports = router;
