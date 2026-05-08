const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maximum number of clients the pool should contain
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait for a connection to become available
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('Connected to PostgreSQL');
    // Schema is managed by Prisma migrations — no runtime DDL.
  } catch (err) {
    logger.error('PostgreSQL Connection Error:', err);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
