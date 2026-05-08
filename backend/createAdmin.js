require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function createAdmin() {
  try {
    const email = 'admin@admin.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // check if exists
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      // update to admin role if exists
      await db.query('UPDATE users SET role = $1, password = $2 WHERE email = $3', ['admin', hashedPassword, email]);
      console.log('Admin already exists. Updated role and password: admin@admin.com / admin123');
    } else {
      await db.query(
        'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5)',
        ['Super Admin', email, hashedPassword, 'admin', true]
      );
      console.log('Admin created successfully: admin@admin.com / admin123');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
