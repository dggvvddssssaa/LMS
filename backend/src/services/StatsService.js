const StatsRepository = require('../repositories/StatsRepository');
const { redisClient } = require('../utils/redis');

class StatsService {
  async getDashboardData() {
    const cacheKey = 'dashboard:stats';
    if (redisClient.isReady) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return JSON.parse(cachedData);
        }
      } catch (redisErr) {
        console.warn('Redis get error in StatsService:', redisErr);
      }
    }

    let overview = { totalUsers: 0, totalCourses: 0, totalRevenue: 0 };
    let monthlyRevenue = [];
    let activeLiveClasses = 0;

    try {
      const results = await Promise.all([
        StatsRepository.getOverviewStats(),
        StatsRepository.getMonthlyRevenue(),
        StatsRepository.getActiveLiveClassesCount()
      ]);
      overview = results[0];
      monthlyRevenue = results[1];
      activeLiveClasses = results[2];
    } catch (err) {
      console.error('Error fetching dashboard stats from DB:', err);
    }

    const result = {
      overview,
      charts: {
        monthlyRevenue
      },
      activeLiveClasses
    };

    if (redisClient.isReady) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(result)); // Cache for 5 minutes
      } catch (redisErr) {
        console.warn('Redis setEx error in StatsService:', redisErr);
      }
    }

    return result;
  }
}

module.exports = new StatsService();
