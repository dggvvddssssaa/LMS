require('dotenv').config();
const db = require('./src/config/db');
async function test() {
  const { rows } = await db.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'lessons' ORDER BY ordinal_position`
  );
  console.log('Lessons columns:', rows.map(r => r.column_name));
  
  const { rows: matCheck } = await db.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'course_materials' ORDER BY ordinal_position`
  );
  console.log('Materials columns:', matCheck.map(r => r.column_name));
  process.exit(0);
}
test();
