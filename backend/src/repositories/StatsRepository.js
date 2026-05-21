const prisma = require('../config/prisma');

class StatsRepository {
  async getOverviewStats() {
    try {
      const [totalUsers, totalCourses, revenueAgg] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.payment.aggregate({
          where: { status: 'completed' },
          _sum: { amount: true }
        })
      ]);

      return {
        totalUsers,
        totalCourses,
        totalRevenue: revenueAgg._sum.amount ? parseFloat(revenueAgg._sum.amount) : 0
      };
    } catch (error) {
      console.error('getOverviewStats error:', error);
      return { totalUsers: 0, totalCourses: 0, totalRevenue: 0 };
    }
  }

  async getMonthlyRevenue() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const payments = await prisma.payment.findMany({
        where: { status: 'completed', created_at: { gte: sixMonthsAgo } },
        select: { amount: true, created_at: true },
        orderBy: { created_at: 'asc' }
      });

      const monthlyMap = {};
      for (const p of payments) {
        const monthKey = p.created_at.toISOString().slice(0, 7);
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + parseFloat(p.amount);
      }

      return Object.entries(monthlyMap).map(([month, revenue]) => ({
        month,
        revenue
      }));
    } catch (error) {
      console.error('getMonthlyRevenue error:', error);
      return [];
    }
  }

  async getActiveLiveClassesCount() {
    try {
      return await prisma.live_classes.count({ where: { status: 'ongoing' } });
    } catch (error) {
      console.error('getActiveLiveClassesCount error:', error);
      return 0;
    }
  }
}

module.exports = new StatsRepository();
