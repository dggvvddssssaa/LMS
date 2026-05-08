const db = require('./src/config/db');

async function check() {
  try {
    const r1 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
    console.log('--- USERS ---');
    r1.rows.forEach(r => console.log('  ' + r.column_name));

    const r2 = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('--- TABLES ---');
    r2.rows.forEach(r => console.log('  ' + r.table_name));

    const r3 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'courses' ORDER BY ordinal_position");
    console.log('--- COURSES ---');
    r3.rows.forEach(r => console.log('  ' + r.column_name));

    const r4 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'lessons' ORDER BY ordinal_position");
    console.log('--- LESSONS ---');
    r4.rows.forEach(r => console.log('  ' + r.column_name));

    const r5 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sections' ORDER BY ordinal_position");
    console.log('--- SECTIONS ---');
    r5.rows.forEach(r => console.log('  ' + r.column_name));

    // Check enrollments table
    const r6 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollments' ORDER BY ordinal_position");
    console.log('--- ENROLLMENTS ---');
    if (r6.rows.length === 0) console.log('  TABLE DOES NOT EXIST');
    else r6.rows.forEach(r => console.log('  ' + r.column_name));

    // Check payments table
    const r7 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position");
    console.log('--- PAYMENTS ---');
    if (r7.rows.length === 0) console.log('  TABLE DOES NOT EXIST');
    else r7.rows.forEach(r => console.log('  ' + r.column_name));

  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    process.exit(0);
  }
}
check();
