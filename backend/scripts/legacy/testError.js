const StatsService = require('./src/services/StatsService');

async function test() {
  try {
    const data = await StatsService.getDashboardData();
    console.log(data);
  } catch (err) {
    console.error('REAL ERROR IS:', err);
  }
  process.exit(0);
}
test();
