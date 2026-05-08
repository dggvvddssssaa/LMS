const config = require('../webrtc/config');
const logger = require('../utils/logger');

class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> { router, peers: Map(socketId -> { transports, producers, consumers }) }
    }

    async createOrGetRoom(roomId, workers) {
        if (this.rooms.has(roomId)) {
            const existing = this.rooms.get(roomId);
            if (existing instanceof Promise) {
                return await existing;
            }
            return existing;
        }

        // Prevention against Race Conditions (Simultaneous joins creating 2 routers)
        const roomPromise = (async () => {
            const worker = workers[0];
            const router = await worker.createRouter({ mediaCodecs: config.router.mediaCodecs });

            const roomState = {
                router,
                peers: new Map() // socketId -> peerObj
            };

            this.rooms.set(roomId, roomState);
            logger.info(`Room created: ${roomId} on worker ${worker.pid}`);
            return roomState;
        })();

        this.rooms.set(roomId, roomPromise);
        return await roomPromise;
    }

    addPeer(roomId, socketId, isTeacher) {
        if (!this.rooms.has(roomId)) return;
        const room = this.rooms.get(roomId);
        if (!room.peers.has(socketId)) {
            room.peers.set(socketId, {
                isTeacher,
                transports: new Map(),
                producers: new Map(),
                consumers: new Map()
            });
        }
    }

    removePeer(socketId) {
        // Inefficient search, but works for checking all rooms
        for (const [roomId, room] of this.rooms) {
            if (room.peers.has(socketId)) {
                const peer = room.peers.get(socketId);
                // Close everything
                peer.transports.forEach(t => t.close());
                room.peers.delete(socketId);

                if (room.peers.size === 0) {
                    room.router.close();
                    this.rooms.delete(roomId);
                    logger.info(`Room closed: ${roomId}`);
                }
                break;
            }
        }
    }

    async createWebRtcTransport(roomId, socketId) {
        const room = this.rooms.get(roomId);
        if (!room) throw new Error('Room not found');

        const transport = await room.router.createWebRtcTransport({
            listenIps: config.webRtcTransport.listenIps,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        });

        const peer = room.peers.get(socketId);
        if (peer) {
            peer.transports.set(transport.id, transport);
        }

        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
            },
            transport
        };
    }

    async connectTransport(roomId, socketId, transportId, dtlsParameters) {
        const room = this.rooms.get(roomId);
        const peer = room.peers.get(socketId);
        const transport = peer.transports.get(transportId);

        if (transport) {
            await transport.connect({ dtlsParameters });
        }
    }

    async produce(roomId, socketId, transportId, kind, rtpParameters, appData) {
        const room = this.rooms.get(roomId);
        const peer = room.peers.get(socketId);
        const transport = peer.transports.get(transportId);

        if (!transport) throw new Error("Transport not found");

        const producer = await transport.produce({ kind, rtpParameters, appData });
        peer.producers.set(producer.id, producer);

        producer.on('transportclose', () => {
            producer.close();
            peer.producers.delete(producer.id);
        });

        return producer.id;
    }

    async consume(roomId, socketId, transportId, producerId, rtpCapabilities) {
        const room = this.rooms.get(roomId);
        const router = room.router;

        if (!router.canConsume({ producerId, rtpCapabilities })) {
            throw new Error('Cannot consume');
        }

        const peer = room.peers.get(socketId);
        const transport = peer.transports.get(transportId);

        if (!transport) throw new Error('No transport found');

        const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
            paused: true, // Start paused
        });

        peer.consumers.set(consumer.id, consumer);

        consumer.on('transportclose', () => {
            consumer.close();
            peer.consumers.delete(consumer.id);
        });

        return {
            producerId,
            id: consumer.id,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused,
            appData: consumer.appData // Pass appData back to client
        };
    }

    async resumeConsumer(roomId, socketId, consumerId) {
        const room = this.rooms.get(roomId);
        if (!room) throw new Error('Room not found');
        const peer = room.peers.get(socketId);
        if (!peer) throw new Error('Peer not found');
        const consumer = peer.consumers.get(consumerId);
        if (consumer) {
            await consumer.resume();
        }
    }

    getProducers(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        const producersList = [];
        for (const [socketId, peer] of room.peers) {
            for (const [producerId, producer] of peer.producers) {
                producersList.push({
                    producerId,
                    peerId: socketId,
                    kind: producer.kind,
                    appData: producer.appData || {}
                });
            }
        }
        return producersList;
    }
}

module.exports = RoomManager;
