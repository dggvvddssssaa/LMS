const StatsService = require('../services/StatsService');

exports.getAdminDashboard = async (req, res) => {
  try {
    const data = await StatsService.getDashboardData();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
