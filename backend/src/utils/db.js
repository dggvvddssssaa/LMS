const prisma = require('../config/prisma');
const logger = require('./logger');

const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');
  } catch (err) {
    logger.error('PostgreSQL Connection Error:', err);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
