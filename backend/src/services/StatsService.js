const StatsRepository = require('../repositories/StatsRepository');
const { redisClient } = require('../utils/redis');

class StatsService {
  async getDashboardData() {
    const cacheKey = 'dashboard:stats';
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const [overview, monthlyRevenue, activeLiveClasses] = await Promise.all([
      StatsRepository.getOverviewStats(),
      StatsRepository.getMonthlyRevenue(),
      StatsRepository.getActiveLiveClassesCount()
    ]);

    const result = {
      overview,
      charts: {
        monthlyRevenue
      },
      activeLiveClasses
    };

    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result)); // Cache for 5 minutes
    }

    return result;
  }
}

module.exports = new StatsService();
