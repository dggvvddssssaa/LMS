require('dotenv').config();
const validateEnv = require('./src/utils/validateEnv');

// Validate environment before importing anything else
validateEnv();

const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/sockets/socketRoutes');
const { initMediasoup } = require('./src/webrtc/mediasoupWorker');
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/utils/db');
const { connectRedis } = require('./src/utils/redis');

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Initialize Services
async function startServer() {
    try {
        // 1. Connect Databases
        await connectDB();
        connectRedis().catch(err => logger.error('Redis start error', err));

        // 2. Initialize Mediasoup Workers
        const workers = await initMediasoup();
        logger.info(`Initialized ${workers.length} mediasoup workers`);

        // 3. Initialize Socket.io (Signaling)
        initSocket(server, workers);

        // 4. Start Server
        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
