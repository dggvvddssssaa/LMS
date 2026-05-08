const db = require('./src/config/db');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const result = await db.query(
      "UPDATE users SET password = $1 WHERE email = 'admin@admin.com' RETURNING id, name, email, role",
      [hashedPassword]
    );
    if (result.rows.length > 0) {
      console.log('Admin password reset successfully:', result.rows[0]);
    } else {
      console.log('No admin user found with email admin@admin.com');
      // List all users
      const users = await db.query("SELECT id, email, role FROM users");
      console.log('All users:', users.rows);
    }
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}
resetAdminPassword();
