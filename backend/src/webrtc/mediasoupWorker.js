const mediasoup = require('mediasoup');
const config = require('./config');
const logger = require('../utils/logger');

let workers = [];
let nextWorkerIdx = 0;

const initMediasoup = async () => {
    // Use number of CPUs for workers, or just 1 for dev
    const numWorkers = 1; // Simplify for dev environment

    for (let i = 0; i < numWorkers; i++) {
        const worker = await mediasoup.createWorker({
            logLevel: config.worker.logLevel,
            logTags: config.worker.logTags,
            rtcMinPort: config.worker.rtcMinPort,
            rtcMaxPort: config.worker.rtcMaxPort,
        });

        worker.on('died', () => {
            logger.error(`mediasoup worker died, exiting in 2 seconds... [pid:${worker.pid}]`);
            setTimeout(() => process.exit(1), 2000);
        });

        workers.push(worker);
    }

    return workers;
};

const getMediasoupWorker = () => {
    const worker = workers[nextWorkerIdx];
    if (++nextWorkerIdx === workers.length) nextWorkerIdx = 0;
    return worker;
};

module.exports = { initMediasoup, getMediasoupWorker };
