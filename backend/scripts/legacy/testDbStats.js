const db = require('./src/config/db');

async function testStats() {
  try {
    const userCount = await db.query("SELECT COUNT(*) FROM users");
    console.log('users:', userCount.rows);
    
    const courseCount = await db.query("SELECT COUNT(*) FROM courses");
    console.log('courses:', courseCount.rows);
    
    const revenueSum = await db.query("SELECT SUM(amount) FROM payments WHERE status = 'completed'");
    console.log('revenue:', revenueSum.rows);
    
    const monthlyRev = await db.query(`
      SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) as revenue
      FROM payments
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `);
    console.log('monthly:', monthlyRev.rows);
    
    const liveClasses = await db.query("SELECT COUNT(*) FROM live_classes WHERE status = 'ongoing'");
    console.log('live_classes:', liveClasses.rows);

    process.exit(0);
  } catch(e) {
    console.error('DB test error:', e);
    process.exit(1);
  }
}
testStats();
