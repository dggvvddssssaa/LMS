const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const listenIp = process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0';
const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || getLocalIp();

// Log effective config at startup
console.log(`[mediasoup config] listenIp=${listenIp}, announcedIp=${announcedIp}, ports=${process.env.MEDIASOUP_MIN_PORT || 40000}-${process.env.MEDIASOUP_MAX_PORT || 40100}`);

module.exports = {
    // Worker settings
    worker: {
        rtcMinPort: Number(process.env.MEDIASOUP_MIN_PORT) || 40000,
        rtcMaxPort: Number(process.env.MEDIASOUP_MAX_PORT) || 40100,
        logLevel: 'warn',
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp',
        ],
    },
    // Router settings
    router: {
        mediaCodecs: [
            {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2
            },
            {
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 1000
                }
            },
            {
                kind: 'video',
                mimeType: 'video/H264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '4d0032',
                    'level-asymmetry-allowed': 1,
                    'x-google-start-bitrate': 1000
                }
            },
        ]
    },
    // WebRtcTransport settings
    webRtcTransport: {
        listenIps: [
            {
                ip: listenIp,
                announcedIp: announcedIp
            }
        ],
        initialAvailableOutgoingBitrate: 1000000,
        minimumAvailableOutgoingBitrate: 600000,
        maxSctpMessageSize: 262144,
    }
};
