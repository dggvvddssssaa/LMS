import { useEffect, useRef, useState, useCallback } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import io from 'socket.io-client';

const log = (...args) => { if(import.meta.env.DEV) console.debug(...args); };

const useWebRTC = (roomId, _isTeacher) => {
    const [peers, setPeers] = useState([]); // [{ peerId, isTeacher, userName, role, camStream, screenStream, hasVideo, hasAudio }]
    const [localStream, setLocalStream] = useState(null);
    const [localScreenStream, setLocalScreenStream] = useState(null);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [error, setError] = useState(null);
    const [connectionState, setConnectionState] = useState('idle');
    const [messages, setMessages] = useState([]);
    const [isJoined, setIsJoined] = useState(false);

    const socketRef = useRef(null);
    const deviceRef = useRef(null);
    const producerTransportRef = useRef(null);
    const consumerTransportRef = useRef(null);
    const producersRef = useRef(new Map()); // key: 'video'|'audio'|'screen' -> { producer, producerId(server) }
    const consumersRef = useRef(new Map()); // consumerId -> consumer
    const consumedProducersRef = useRef(new Set()); // producerId set
    const pendingProducersRef = useRef([]);
    const canonicalRoomIdRef = useRef(roomId);

    // Map producerId -> { peerId, kind, source } for tracking which producer belongs to which peer
    const producerMapRef = useRef(new Map());

    const request = useCallback((type, data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) return reject('Socket not connected');
            socketRef.current.emit(type, data, (response) => {
                if (response && response.error) reject(response.error);
                else resolve(response);
            });
        });
    }, []);

    const consume = useCallback(async (producerId, peerId, kind, appData) => {
        try {
            if (consumedProducersRef.current.has(producerId)) return;

            const device = deviceRef.current;
            const transport = consumerTransportRef.current;

            if (!device || !transport) {
                log(`[WebRTC] Queuing producer ${producerId} (transport not ready)`);
                pendingProducersRef.current.push({ producerId, peerId, kind, appData });
                return;
            }

            const { rtpCapabilities } = device;
            const effectiveRoomId = canonicalRoomIdRef.current;

            log(`[WebRTC] Consuming producer ${producerId} from peer ${peerId} (kind=${kind}, source=${appData?.source || 'camera'})`);

            const data = await request('consume', {
                roomId: effectiveRoomId,
                transportId: transport.id,
                producerId,
                rtpCapabilities
            });

            const { id, rtpParameters, appData: serverAppData } = data;
            const effectiveAppData = serverAppData || appData || {};
            const source = effectiveAppData.source || 'camera';

            const consumer = await transport.consume({ id, producerId, kind, rtpParameters });
            consumedProducersRef.current.add(producerId);
            consumersRef.current.set(consumer.id, consumer);

            // Track this producer
            producerMapRef.current.set(producerId, { peerId, kind, source });

            // Handle server-side producer close (fires when server calls producer.close())
            consumer.on('producerclose', () => {
                log(`[WebRTC] Consumer producerclose: ${producerId} from ${peerId} kind=${kind} source=${source}`);
                consumedProducersRef.current.delete(producerId);
                consumersRef.current.delete(consumer.id);
                producerMapRef.current.delete(producerId);

                // Remove the track from peer state
                setPeers(prev => prev.map(p => {
                    if (p.peerId !== peerId) return p;
                    const updated = { ...p };
                    if (source === 'screen') {
                        updated.screenStream = new MediaStream();
                    } else if (kind === 'video') {
                        const tracks = p.camStream.getTracks().filter(t => t.kind !== 'video');
                        updated.camStream = new MediaStream(tracks);
                        updated.hasVideo = false;
                    } else if (kind === 'audio') {
                        const tracks = p.camStream.getTracks().filter(t => t.kind !== 'audio');
                        updated.camStream = new MediaStream(tracks);
                        updated.hasAudio = false;
                    }
                    return updated;
                }));
            });

            consumer.on('transportclose', () => {
                consumedProducersRef.current.delete(producerId);
                consumersRef.current.delete(consumer.id);
                producerMapRef.current.delete(producerId);
            });

            // Add track to peer state
            setPeers(prev => {
                const newPeers = prev.map(p => ({ ...p }));
                let peer = newPeers.find(p => p.peerId === peerId);
                if (!peer) {
                    peer = {
                        peerId,
                        isTeacher: false,
                        userName: 'Unknown',
                        role: 'student',
                        camStream: new MediaStream(),
                        screenStream: new MediaStream(),
                        hasVideo: false,
                        hasAudio: false,
                    };
                    newPeers.push(peer);
                }

                if (source === 'screen') {
                    peer.screenStream = new MediaStream([...peer.screenStream.getTracks(), consumer.track]);
                } else {
                    peer.camStream = new MediaStream([...peer.camStream.getTracks(), consumer.track]);
                    if (kind === 'video') peer.hasVideo = true;
                    if (kind === 'audio') peer.hasAudio = true;
                }
                return newPeers;
            });

            await request('resume', { roomId: effectiveRoomId, consumerId: consumer.id });
            consumer.resume();

            log(`[WebRTC] Consuming OK: ${producerId} kind=${kind} source=${source}`);
        } catch (err) {
            console.error('[WebRTC] Error consuming producer', producerId, err);
        }
    }, [request]);

    const drainPendingProducers = useCallback(() => {
        const pending = [...pendingProducersRef.current];
        pendingProducersRef.current = [];
        log(`[WebRTC] Draining ${pending.length} pending producers`);
        for (const p of pending) {
            consume(p.producerId, p.peerId, p.kind, p.appData);
        }
    }, [consume]);

    const initTransports = useCallback(async () => {
        const device = deviceRef.current;
        if (!device) return;

        const effectiveRoomId = canonicalRoomIdRef.current;

        // Send Transport
        try {
            setConnectionState('connecting');
            const sendTransportData = await request('createWebRtcTransport', { roomId: effectiveRoomId });
            const sendTransport = device.createSendTransport(sendTransportData);

            sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
                request('connectTransport', { roomId: effectiveRoomId, transportId: sendTransport.id, dtlsParameters })
                    .then(callback).catch(errback);
            });

            sendTransport.on('produce', ({ kind, rtpParameters, appData }, callback, errback) => {
                request('produce', { roomId: effectiveRoomId, transportId: sendTransport.id, kind, rtpParameters, appData })
                    .then(({ id }) => callback({ id })).catch(errback);
            });

            sendTransport.on('connectionstatechange', (state) => {
                log(`[WebRTC] Send transport state: ${state}`);
                if (state === 'failed') {
                    setError('Kết nối media gửi thất bại');
                    setConnectionState('failed');
                }
            });

            producerTransportRef.current = sendTransport;
        } catch (err) {
            console.error('[WebRTC] Send transport error', err);
            setError('Không thể tạo kết nối gửi media');
        }

        // Receive Transport
        try {
            const recvTransportData = await request('createWebRtcTransport', { roomId: effectiveRoomId });
            const recvTransport = device.createRecvTransport(recvTransportData);

            recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
                request('connectTransport', { roomId: effectiveRoomId, transportId: recvTransport.id, dtlsParameters })
                    .then(callback).catch(errback);
            });

            recvTransport.on('connectionstatechange', (state) => {
                log(`[WebRTC] Recv transport state: ${state}`);
                if (state === 'connected') {
                    setConnectionState('connected');
                } else if (state === 'failed') {
                    setError('Kết nối media nhận thất bại');
                    setConnectionState('failed');
                }
            });

            consumerTransportRef.current = recvTransport;
            drainPendingProducers();
        } catch (err) {
            console.error('[WebRTC] Recv transport error', err);
            setError('Không thể tạo kết nối nhận media');
        }
    }, [request, drainPendingProducers]);

    const loadDevice = useCallback(async (routerRtpCapabilities) => {
        try {
            const device = new mediasoupClient.Device();
            await device.load({ routerRtpCapabilities });
            deviceRef.current = device;
            log('[WebRTC] Device loaded');
        } catch (error) {
            console.error('[WebRTC] Device load failed', error);
            setError('Trình duyệt không hỗ trợ WebRTC');
        }
    }, []);

    const sendMessage = useCallback((text) => {
        if (!socketRef.current) return;
        socketRef.current.emit('chatMessage', { roomId: canonicalRoomIdRef.current, text });
    }, []);

    // ====== CLOSE PRODUCER: emit to server so remote consumers get notified ======
    const closeProducerOnServer = useCallback((producerId) => {
        if (!socketRef.current || !producerId) return;
        socketRef.current.emit('closeProducer', { producerId }, (res) => {
            if (res?.error) console.warn('[WebRTC] closeProducer error:', res.error);
            else log(`[WebRTC] closeProducer OK: ${producerId}`);
        });
    }, []);

    const initWebRTC = useCallback(() => {
        setIsJoined(true);
        setConnectionState('connecting');
        setError(null);

        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const token = localStorage.getItem('token');
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            log('[WebRTC] Socket connected:', socket.id);
            setConnectionState(prev => prev !== 'reconnecting' ? 'connecting' : prev);
            socket.emit('joinRoom', { roomId }, async (response) => {
                if (response && response.error) {
                    setError(response.error);
                    setConnectionState('failed');
                    setIsJoined(false);
                    return;
                }
                const { rtpCapabilities, activePeers, canonicalRoomId } = response;

                if (canonicalRoomId) {
                    canonicalRoomIdRef.current = canonicalRoomId;
                    log(`[WebRTC] Canonical room: ${canonicalRoomId}`);
                }

                if (activePeers) {
                    setPeers(prev => {
                        const newPeers = [...prev];
                        activePeers.forEach(ap => {
                            if (ap.peerId === socket.id) return;
                            if (!newPeers.find(p => p.peerId === ap.peerId)) {
                                newPeers.push({
                                    peerId: ap.peerId,
                                    isTeacher: ap.isTeacher,
                                    userName: ap.userName || 'Unknown',
                                    role: ap.role || 'student',
                                    camStream: new MediaStream(),
                                    screenStream: new MediaStream(),
                                    hasVideo: false,
                                    hasAudio: false,
                                });
                            }
                        });
                        return newPeers;
                    });
                }

                await loadDevice(rtpCapabilities);
                await initTransports();

                const effectiveRoomId = canonicalRoomIdRef.current;
                socket.emit('getProducers', { roomId: effectiveRoomId }, (producers) => {
                    if (!Array.isArray(producers)) return;
                    log(`[WebRTC] ${producers.length} existing producers`);
                    producers.forEach(p => {
                        if (p.peerId !== socket.id) {
                            consume(p.producerId, p.peerId, p.kind, p.appData);
                        }
                    });
                });

                setConnectionState('connected');
            });
        });

        socket.on('connect_error', (err) => {
            console.error('[WebRTC] Connect error:', err.message);
            setError(`Lỗi kết nối: ${err.message}`);
            setConnectionState('failed');
        });

        socket.on('newProducer', ({ producerId, peerId, kind, appData }) => {
            log(`[WebRTC] newProducer: ${producerId} from ${peerId} kind=${kind}`);
            if (peerId !== socket.id) {
                consume(producerId, peerId, kind, appData);
            }
        });

        // Handle explicit producerClosed from server (belt-and-suspenders with consumer.on('producerclose'))
        socket.on('producerClosed', ({ peerId, producerId, kind, source }) => {
            log(`[WebRTC] producerClosed: ${producerId} from ${peerId} kind=${kind} source=${source}`);

            consumedProducersRef.current.delete(producerId);
            producerMapRef.current.delete(producerId);

            setPeers(prev => prev.map(p => {
                if (p.peerId !== peerId) return p;
                const updated = { ...p };
                if (source === 'screen') {
                    updated.screenStream = new MediaStream();
                } else if (kind === 'video') {
                    const tracks = p.camStream.getTracks().filter(t => t.kind !== 'video');
                    updated.camStream = new MediaStream(tracks);
                    updated.hasVideo = false;
                } else if (kind === 'audio') {
                    const tracks = p.camStream.getTracks().filter(t => t.kind !== 'audio');
                    updated.camStream = new MediaStream(tracks);
                    updated.hasAudio = false;
                }
                return updated;
            }));
        });

        socket.on('producerPaused', ({ peerId, kind, source: _source }) => {
            log(`[WebRTC] producerPaused: ${peerId} kind=${kind}`);
        });

        socket.on('producerResumed', ({ peerId, kind, source: _source }) => {
            log(`[WebRTC] producerResumed: ${peerId} kind=${kind}`);
        });

        socket.on('chatMessage', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('newPeer', ({ peerId, isTeacher, userName, role }) => {
            log(`[WebRTC] newPeer: ${peerId} (${userName})`);
            setPeers(prev => {
                if (prev.find(p => p.peerId === peerId)) return prev;
                return [...prev, {
                    peerId,
                    isTeacher,
                    userName: userName || 'Unknown',
                    role: role || 'student',
                    camStream: new MediaStream(),
                    screenStream: new MediaStream(),
                    hasVideo: false,
                    hasAudio: false,
                }];
            });
        });

        socket.on('peerLeft', ({ peerId }) => {
            log(`[WebRTC] peerLeft: ${peerId}`);
            // Clean up producer map entries for this peer
            for (const [pid, info] of producerMapRef.current) {
                if (info.peerId === peerId) {
                    producerMapRef.current.delete(pid);
                    consumedProducersRef.current.delete(pid);
                }
            }
            setPeers(prev => prev.filter(p => p.peerId !== peerId));
        });

        socket.on('disconnect', (reason) => {
            log(`[WebRTC] Disconnected: ${reason}`);
            if (reason === 'io server disconnect') {
                setConnectionState('failed');
                setError('Mất kết nối đến máy chủ');
            }
        });

        socket.io.on('reconnect_attempt', (attempt) => {
            log(`[WebRTC] Reconnect attempt ${attempt}`);
            setConnectionState('reconnecting');
        });

        socket.io.on('reconnect', () => {
            log('[WebRTC] Reconnected, rejoining room...');
            setConnectionState('connecting');

            const device = deviceRef.current;
            producerTransportRef.current = null;
            consumerTransportRef.current = null;
            producersRef.current.clear();
            consumersRef.current.clear();
            consumedProducersRef.current.clear();
            producerMapRef.current.clear();

            socket.emit('joinRoom', { roomId }, async (response) => {
                if (response?.error) {
                    setError(response.error);
                    setConnectionState('failed');
                    setIsJoined(false);
                    return;
                }
                const { rtpCapabilities, activePeers, canonicalRoomId } = response;
                if (canonicalRoomId) canonicalRoomIdRef.current = canonicalRoomId;

                if (activePeers) {
                    setPeers(activePeers.map(ap => ({
                        peerId: ap.peerId,
                        isTeacher: ap.isTeacher,
                        userName: ap.userName || 'Unknown',
                        role: ap.role || 'student',
                        camStream: new MediaStream(),
                        screenStream: new MediaStream(),
                        hasVideo: false,
                        hasAudio: false,
                    })));
                }

                if (!device) await loadDevice(rtpCapabilities);
                await initTransports();

                const effectiveRoomId = canonicalRoomIdRef.current;
                socket.emit('getProducers', { roomId: effectiveRoomId }, (producers) => {
                    if (!Array.isArray(producers)) return;
                    producers.forEach(p => {
                        if (p.peerId !== socket.id) consume(p.producerId, p.peerId, p.kind, p.appData);
                    });
                });

                setConnectionState('connected');
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId, loadDevice, initTransports, consume]);

    useEffect(() => {
        const socket = socketRef.current;
        const producers = producersRef.current;
        const consumers = consumersRef.current;
        const consumed = consumedProducersRef.current;
        const producerMap = producerMapRef.current;
        return () => {
            if (socket) socket.disconnect();
            producers.forEach(({ producer }) => {
                if (producer?.track) producer.track.stop();
                try { producer?.close(); } catch { /* */ }
            });
            producers.clear();
            consumers.forEach(consumer => {
                try { consumer.close(); } catch { /* */ }
            });
            consumers.clear();
            consumed.clear();
            producerMap.clear();
            pendingProducersRef.current = [];
        };
    }, []);

    const getLocalStream = async (video, audio) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
            if (localStream) {
                const newTracks = stream.getTracks();
                const existingTracks = localStream.getTracks();
                newTracks.forEach(t => {
                    const oldMatch = existingTracks.find(ot => ot.kind === t.kind);
                    if (oldMatch) {
                        localStream.removeTrack(oldMatch);
                        oldMatch.stop();
                    }
                    localStream.addTrack(t);
                });
                setLocalStream(new MediaStream(localStream.getTracks()));
            } else {
                setLocalStream(stream);
            }
            return localStream ? new MediaStream(localStream.getTracks()) : stream;
        } catch (err) {
            console.error('[WebRTC] getUserMedia failed', err);
            setError('Không thể truy cập camera/microphone');
            return null;
        }
    };

    const toggleVideo = async () => {
        try {
            if (isCamOn && producersRef.current.has('video')) {
                const { producer, producerId } = producersRef.current.get('video');

                // 1. Tell server to close the producer FIRST — this triggers producerclose on remote consumers
                closeProducerOnServer(producerId);

                // 2. Close local producer
                producer.close();
                producersRef.current.delete('video');

                // 3. Stop local track
                if (localStream) {
                    const track = localStream.getVideoTracks()[0];
                    if (track) {
                        track.stop();
                        localStream.removeTrack(track);
                    }
                    setLocalStream(new MediaStream(localStream.getTracks()));
                }
                setIsCamOn(false);
            } else {
                const stream = await getLocalStream(true, isMicOn);
                if (!stream) return;
                const track = stream.getVideoTracks()[0];
                if (track && producerTransportRef.current) {
                    const producer = await producerTransportRef.current.produce({ track });
                    producersRef.current.set('video', { producer, producerId: producer.id });
                    setIsCamOn(true);
                }
            }
        } catch (err) {
            console.error("[WebRTC] Camera fail", err);
            setError("Không thể bật camera");
        }
    };

    const toggleAudio = async () => {
        try {
            if (isMicOn && producersRef.current.has('audio')) {
                const { producer, producerId } = producersRef.current.get('audio');

                // Tell server to close
                closeProducerOnServer(producerId);

                producer.close();
                producersRef.current.delete('audio');

                if (localStream) {
                    const track = localStream.getAudioTracks()[0];
                    if (track) {
                        track.stop();
                        localStream.removeTrack(track);
                    }
                    setLocalStream(new MediaStream(localStream.getTracks()));
                }
                setIsMicOn(false);
            } else {
                const stream = await getLocalStream(isCamOn, true);
                if (!stream) return;
                const track = stream.getAudioTracks()[0];
                if (track && producerTransportRef.current) {
                    const producer = await producerTransportRef.current.produce({ track });
                    producersRef.current.set('audio', { producer, producerId: producer.id });
                    setIsMicOn(true);
                }
            }
        } catch (err) {
            console.error("[WebRTC] Mic fail", err);
            setError("Không thể bật microphone");
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (isScreenSharing && producersRef.current.has('screen')) {
                const { producer, producerId } = producersRef.current.get('screen');

                closeProducerOnServer(producerId);

                producer.close();
                producersRef.current.delete('screen');

                if (localScreenStream) {
                    localScreenStream.getTracks().forEach(t => t.stop());
                    setLocalScreenStream(null);
                }
                setIsScreenSharing(false);
            } else {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).catch(() => null);
                if (!stream) return;

                const track = stream.getVideoTracks()[0];
                if (track && producerTransportRef.current) {
                    const producer = await producerTransportRef.current.produce({ track, appData: { source: 'screen' } });
                    producersRef.current.set('screen', { producer, producerId: producer.id });

                    setLocalScreenStream(stream);
                    setIsScreenSharing(true);

                    track.onended = () => {
                        if (producersRef.current.has('screen')) {
                            const entry = producersRef.current.get('screen');
                            closeProducerOnServer(entry.producerId);
                            entry.producer.close();
                            producersRef.current.delete('screen');
                        }
                        setLocalScreenStream(null);
                        setIsScreenSharing(false);
                    };
                }
            }
        } catch (err) {
            console.error("[WebRTC] Screen share fail", err);
            setError("Không thể chia sẻ màn hình");
        }
    };

    return {
        isJoined,
        initWebRTC,
        localStream,
        localScreenStream,
        peers,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        isCamOn,
        isMicOn,
        isScreenSharing,
        error,
        connectionState,
        messages,
        sendMessage,
    };
};

export default useWebRTC;
