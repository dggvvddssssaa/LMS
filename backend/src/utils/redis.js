const { createClient } = require('redis');
const logger = require('./logger');

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

const connectRedis = async () => {
    try {
        await redisClient.connect();
        logger.info('Connected to Redis');
    } catch (err) {
        logger.error('Redis Connection Failed:', err);
    }
};

module.exports = { redisClient, connectRedis };
