require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Super Admin';
    const forceReset = process.env.ADMIN_FORCE_RESET === 'true';

    if (!email || !password) {
      console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // check if exists
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      if (forceReset) {
        // update to admin role and reset password if forceReset is true
        await db.query('UPDATE users SET role = $1, password = $2 WHERE email = $3', ['admin', hashedPassword, email]);
        console.log('Admin already exists. Force reset: Updated role and password.');
      } else {
        console.log('Admin user already exists. Use ADMIN_FORCE_RESET=true to reset password.');
      }
    } else {
      await db.query(
        'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5)',
        [name, email, hashedPassword, 'admin', true]
      );
      console.log('Admin created successfully.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
