const config = require('../webrtc/config');
const logger = require('../utils/logger');

class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> { router, peers: Map(socketId -> peerObj) }
    }

    async createOrGetRoom(roomId, workers) {
        if (this.rooms.has(roomId)) {
            const existing = this.rooms.get(roomId);
            if (existing instanceof Promise) {
                return await existing;
            }
            return existing;
        }

        const roomPromise = (async () => {
            const worker = workers[0];
            const router = await worker.createRouter({ mediaCodecs: config.router.mediaCodecs });

            const roomState = {
                router,
                peers: new Map()
            };

            this.rooms.set(roomId, roomState);
            logger.info(`Room created: ${roomId} on worker ${worker.pid}`);
            return roomState;
        })();

        this.rooms.set(roomId, roomPromise);
        return await roomPromise;
    }

    addPeer(roomId, socketId, isTeacher, userName, role) {
        if (!this.rooms.has(roomId)) return;
        const room = this.rooms.get(roomId);
        if (!room.peers.has(socketId)) {
            room.peers.set(socketId, {
                isTeacher,
                userName: userName || 'Unknown',
                role: role || 'student',
                transports: new Map(),
                producers: new Map(),
                consumers: new Map()
            });
        }
    }

    removePeer(socketId) {
        for (const [roomId, room] of this.rooms) {
            if (room instanceof Promise) continue;
            if (room.peers && room.peers.has(socketId)) {
                const peer = room.peers.get(socketId);

                // Close all consumers first
                peer.consumers.forEach(consumer => {
                    try { consumer.close(); } catch (e) { /* already closed */ }
                });
                peer.consumers.clear();

                // Close all producers — this triggers 'producerclose' on remote consumers
                peer.producers.forEach(producer => {
                    try { producer.close(); } catch (e) { /* already closed */ }
                });
                peer.producers.clear();

                // Close all transports
                peer.transports.forEach(transport => {
                    try { transport.close(); } catch (e) { /* already closed */ }
                });
                peer.transports.clear();

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
            initialAvailableOutgoingBitrate: config.webRtcTransport.initialAvailableOutgoingBitrate,
        });

        transport.on('icestatechange', (iceState) => {
            logger.info(`Transport ${transport.id} ICE: ${iceState} (room=${roomId}, peer=${socketId})`);
        });

        transport.on('dtlsstatechange', (dtlsState) => {
            logger.info(`Transport ${transport.id} DTLS: ${dtlsState} (room=${roomId}, peer=${socketId})`);
            if (dtlsState === 'failed' || dtlsState === 'closed') {
                logger.warn(`Transport ${transport.id} DTLS ${dtlsState} — closing`);
                transport.close();
            }
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
        if (!room) throw new Error('Room not found');
        const peer = room.peers.get(socketId);
        if (!peer) throw new Error('Peer not found');
        const transport = peer.transports.get(transportId);
        if (!transport) throw new Error('Transport not found');

        await transport.connect({ dtlsParameters });
        logger.info(`Transport ${transportId} connected (room=${roomId}, peer=${socketId})`);
    }

    async produce(roomId, socketId, transportId, kind, rtpParameters, appData) {
        const room = this.rooms.get(roomId);
        if (!room) throw new Error('Room not found');
        const peer = room.peers.get(socketId);
        if (!peer) throw new Error('Peer not found');
        const transport = peer.transports.get(transportId);
        if (!transport) throw new Error('Transport not found');

        const producer = await transport.produce({ kind, rtpParameters, appData });
        peer.producers.set(producer.id, producer);

        logger.info(`Producer created: ${producer.id} kind=${kind} source=${appData?.source || 'camera'} (room=${roomId}, peer=${socketId})`);

        producer.on('transportclose', () => {
            logger.info(`Producer ${producer.id} closed: transport closed`);
            peer.producers.delete(producer.id);
        });

        return producer.id;
    }

    /**
     * Close a specific producer server-side.
     * This triggers 'producerclose' on all consumers of this producer.
     * Returns { kind, appData } of the closed producer, or null if not found.
     */
    closeProducer(roomId, socketId, producerId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        const peer = room.peers.get(socketId);
        if (!peer) return null;
        const producer = peer.producers.get(producerId);
        if (!producer) return null;

        const kind = producer.kind;
        const appData = producer.appData || {};

        // This closes the server-side producer, which triggers 'producerclose'
        // on all consumers of this producer across all peers
        producer.close();
        peer.producers.delete(producerId);

        logger.info(`Producer closed: ${producerId} kind=${kind} source=${appData.source || 'camera'} (room=${roomId}, peer=${socketId})`);

        return { kind, appData };
    }

    /**
     * Pause a producer (mute without closing — keeps transport alive)
     */
    async pauseProducer(roomId, socketId, producerId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        const peer = room.peers.get(socketId);
        if (!peer) return null;
        const producer = peer.producers.get(producerId);
        if (!producer) return null;

        await producer.pause();
        logger.info(`Producer paused: ${producerId} (room=${roomId}, peer=${socketId})`);
        return { kind: producer.kind, appData: producer.appData || {} };
    }

    /**
     * Resume a paused producer
     */
    async resumeProducer(roomId, socketId, producerId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        const peer = room.peers.get(socketId);
        if (!peer) return null;
        const producer = peer.producers.get(producerId);
        if (!producer) return null;

        await producer.resume();
        logger.info(`Producer resumed: ${producerId} (room=${roomId}, peer=${socketId})`);
        return { kind: producer.kind, appData: producer.appData || {} };
    }

    async consume(roomId, socketId, transportId, producerId, rtpCapabilities) {
        const room = this.rooms.get(roomId);
        if (!room) throw new Error('Room not found');
        const router = room.router;

        if (!router.canConsume({ producerId, rtpCapabilities })) {
            throw new Error('Cannot consume — incompatible codecs');
        }

        const peer = room.peers.get(socketId);
        if (!peer) throw new Error('Peer not found');
        const transport = peer.transports.get(transportId);
        if (!transport) throw new Error('Transport not found');

        // Find the producer's appData and owning peerId
        let producerAppData = {};
        let producerPeerId = null;
        for (const [sid, p] of room.peers) {
            if (p.producers.has(producerId)) {
                producerAppData = p.producers.get(producerId).appData || {};
                producerPeerId = sid;
                break;
            }
        }

        const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
            paused: true,
        });

        peer.consumers.set(consumer.id, consumer);

        consumer.on('transportclose', () => {
            consumer.close();
            peer.consumers.delete(consumer.id);
        });

        consumer.on('producerclose', () => {
            logger.info(`Consumer ${consumer.id} closed: producer ${producerId} closed`);
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
            appData: producerAppData,
            producerPeerId: producerPeerId,
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

    getRoomState(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        const peers = [];
        for (const [socketId, peer] of room.peers) {
            const producerDetails = [];
            peer.producers.forEach((prod, pid) => {
                producerDetails.push({
                    id: pid,
                    kind: prod.kind,
                    paused: prod.paused,
                    source: prod.appData?.source || 'camera'
                });
            });
            peers.push({
                socketId,
                userName: peer.userName,
                role: peer.role,
                producers: producerDetails,
                consumerCount: peer.consumers.size,
                transportCount: peer.transports.size,
            });
        }
        return { roomId, peerCount: room.peers.size, peers };
    }
}

module.exports = RoomManager;
