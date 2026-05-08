require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  try {
    const result = await db.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollments'"
    );
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
