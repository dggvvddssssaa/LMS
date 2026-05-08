const db = require('../config/db');

class StatsRepository {
  async getOverviewStats() {
    const userCount = await db.query("SELECT COUNT(*) FROM users");
    const courseCount = await db.query("SELECT COUNT(*) FROM courses");
    const revenueSum = await db.query("SELECT SUM(amount) FROM payments WHERE status = 'completed'");
    
    return {
      totalUsers: parseInt(userCount.rows[0].count),
      totalCourses: parseInt(courseCount.rows[0].count),
      totalRevenue: revenueSum.rows[0].sum ? parseFloat(revenueSum.rows[0].sum) : 0
    };
  }

  async getMonthlyRevenue() {
    // Generate simple monthly revenue chart data
    const query = `
      SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) as revenue
      FROM payments
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getActiveLiveClassesCount() {
    const query = `SELECT COUNT(*) FROM live_classes WHERE status = 'ongoing'`;
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = new StatsRepository();
