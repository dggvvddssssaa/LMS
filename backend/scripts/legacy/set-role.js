const { Pool } = require('pg');
require('dotenv').config({path: __dirname + '/.env'});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setRole(email, role) {
  try {
    const res = await pool.query('UPDATE users SET role = $1, is_verified = true WHERE email = $2 RETURNING *', [role, email]);
    if (res.rows.length > 0) {
      console.log(`Successfully updated ${email} to role ${role}`);
    } else {
      console.log(`User ${email} not found`);
    }
  } catch (err) {
    console.error('Error updating role:', err);
  } finally {
    pool.end();
  }
}

const args = process.argv.slice(2);
if (args.length !== 2) {
    console.log('Usage: node set-role.js <email> <role>');
    process.exit(1);
}

setRole(args[0], args[1]);
