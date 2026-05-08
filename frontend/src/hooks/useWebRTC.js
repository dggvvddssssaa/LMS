import { useEffect, useRef, useState, useCallback } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import io from 'socket.io-client';

const useWebRTC = (roomId, isTeacher) => {
    const [peers, setPeers] = useState([]); // [{ peerId, isTeacher, camStream, screenStream }]
    const [localStream, setLocalStream] = useState(null);
    const [localScreenStream, setLocalScreenStream] = useState(null);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isJoined, setIsJoined] = useState(false);

    const socketRef = useRef(null);
    const deviceRef = useRef(null);
    const producerTransportRef = useRef(null);
    const consumerTransportRef = useRef(null);
    const producersRef = useRef(new Map());
    const consumersRef = useRef(new Map());
    const consumedProducersRef = useRef(new Set()); // Track what we've already consumed to prevent dups

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
            if (consumedProducersRef.current.has(producerId)) return; // Prevent duplicate consumption of the same producer
            const device = deviceRef.current;
            const transport = consumerTransportRef.current;
            if (!device || !transport) return;
            const { rtpCapabilities } = device;

            const data = await request('consume', { roomId, transportId: transport.id, producerId, rtpCapabilities });
            const { id, rtpParameters } = data; // kind is passed from arguments

            const consumer = await transport.consume({ id, producerId, kind, rtpParameters });
            consumedProducersRef.current.add(producerId); // Mark as consumed

            setPeers(prev => {
                const newPeers = prev.map(p => ({ ...p }));
                let peer = newPeers.find(p => p.peerId === peerId);
                if (!peer) {
                    // We might not know their teacher status yet if they joined really fast, fallback to false
                    peer = { peerId, isTeacher: false, camStream: new MediaStream(), screenStream: new MediaStream() };
                    newPeers.push(peer);
                }

                if (appData && appData.source === 'screen') {
                    peer.screenStream.addTrack(consumer.track);
                    peer.screenStream = new MediaStream(peer.screenStream.getTracks());
                } else {
                    peer.camStream.addTrack(consumer.track);
                    peer.camStream = new MediaStream(peer.camStream.getTracks());
                }
                return newPeers;
            });

            consumersRef.current.set(consumer.id, consumer);

            // Tell backend to resume sending media
            await request('resume', { roomId, consumerId: consumer.id });
            consumer.resume(); // Resume local consumer object
        } catch (err) {
            console.error('Error consuming', err);
        }
    }, [roomId, request]);

    const initTransports = useCallback(async () => {
        const device = deviceRef.current;
        if (!device) return;

        try {
            const sendTransportData = await request('createWebRtcTransport', { roomId });
            const sendTransport = device.createSendTransport(sendTransportData);

            sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
                request('connectTransport', { roomId, transportId: sendTransport.id, dtlsParameters })
                    .then(callback).catch(errback);
            });

            sendTransport.on('produce', ({ kind, rtpParameters, appData }, callback, errback) => {
                request('produce', { roomId, transportId: sendTransport.id, kind, rtpParameters, appData })
                    .then(({ id }) => callback({ id })).catch(errback);
            });
            producerTransportRef.current = sendTransport;
        } catch (err) {
            console.error('Error creating send transport', err);
        }

        try {
            const recvTransportData = await request('createWebRtcTransport', { roomId });
            const recvTransport = device.createRecvTransport(recvTransportData);

            recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
                request('connectTransport', { roomId, transportId: recvTransport.id, dtlsParameters })
                    .then(callback).catch(errback);
            });
            recvTransport.appData = { consuming: true };
            consumerTransportRef.current = recvTransport;
        } catch (err) {
            console.error('Error creating recv transport', err);
        }
    }, [roomId, request]);

    const loadDevice = useCallback(async (routerRtpCapabilities) => {
        try {
            const device = new mediasoupClient.Device();
            await device.load({ routerRtpCapabilities });
            deviceRef.current = device;
            console.debug('Device loaded');
        } catch (error) {
            console.error('Failed to load device', error);
            setError('Browser not supported for WebRTC');
        }
    }, []);

    const sendMessage = useCallback((text, senderName) => {
        if (!socketRef.current) return;
        socketRef.current.emit('chatMessage', { roomId, text, senderName });
    }, [roomId]);

    const initWebRTC = useCallback(() => {
        setIsJoined(true);
        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const token = localStorage.getItem('token');
        const socket = io(SOCKET_URL, {
            auth: { token }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.debug('Socket connected:', socket.id);
            socket.emit('joinRoom', { roomId }, async (response) => {
                if (response && response.error) {
                    setError(response.error);
                    return;
                }
                const { rtpCapabilities, activePeers } = response;

                // Merge activePeers into state without overwriting existing peers containing streams
                if (activePeers) {
                    setPeers(prev => {
                        const newPeers = [...prev];
                        activePeers.forEach(ap => {
                            if (ap.peerId === socket.id) return;
                            if (!newPeers.find(p => p.peerId === ap.peerId)) {
                                newPeers.push({
                                    peerId: ap.peerId,
                                    isTeacher: ap.isTeacher,
                                    camStream: new MediaStream(),
                                    screenStream: new MediaStream()
                                });
                            }
                        });
                        return newPeers;
                    });
                }

                await loadDevice(rtpCapabilities);
                await initTransports();

                // Fetch existing producers in the room to sync state correctly
                socket.emit('getProducers', { roomId }, (producers) => {
                    // Safety check if socket is defined
                    producers.forEach(p => {
                        if (p.peerId !== socket.id) {
                            consume(p.producerId, p.peerId, p.kind, p.appData);
                        }
                    });
                });
            });
        });

        socket.on('newProducer', ({ producerId, peerId, kind, appData }) => {
            console.debug('New producer broadcasted:', producerId, peerId);
            consume(producerId, peerId, kind, appData);
        });

        socket.on('chatMessage', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('newPeer', ({ peerId, isTeacher }) => {
            console.debug('New peer joined:', peerId);
            setPeers(prev => {
                if (prev.find(p => p.peerId === peerId)) return prev;
                return [...prev, { peerId, isTeacher, camStream: new MediaStream(), screenStream: new MediaStream() }];
            });
        });

        socket.on('peerLeft', ({ peerId }) => {
            console.debug('Peer left:', peerId);
            setPeers(prev => prev.filter(p => p.peerId !== peerId));
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId, isTeacher, loadDevice, initTransports, consume]);

    useEffect(() => {
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            // Stop all producers' tracks on unmount
            producersRef.current.forEach(producer => {
                if (producer.track) producer.track.stop();
                producer.close();
            });
            producersRef.current.clear();
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
            console.error('Failed to get media devices', err);
            setError('Permission denied for camera/microphone');
            return null;
        }
    };

    const toggleVideo = async () => {
        try {
            if (isCamOn && producersRef.current.has('video')) {
                const producer = producersRef.current.get('video');
                producer.close();
                producersRef.current.delete('video');
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
                    producersRef.current.set('video', producer);
                    setIsCamOn(true);
                }
            }
        } catch (err) {
            console.error("Camera fail", err);
            setError("Could not switch camera");
        }
    };

    const toggleAudio = async () => {
        try {
            if (isMicOn && producersRef.current.has('audio')) {
                const producer = producersRef.current.get('audio');
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
                    producersRef.current.set('audio', producer);
                    setIsMicOn(true);
                }
            }
        } catch (err) {
            console.error("Mic fail", err);
            setError("Could not switch microhpone");
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (isScreenSharing && producersRef.current.has('screen')) {
                const producer = producersRef.current.get('screen');
                producer.close();
                producersRef.current.delete('screen');
                if (localScreenStream) {
                    localScreenStream.getTracks().forEach(t => t.stop());
                    setLocalScreenStream(null);
                }
                setIsScreenSharing(false);
            } else {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).catch(() => null);
                if (!stream) return; // User cancelled

                const track = stream.getVideoTracks()[0];
                if (track && producerTransportRef.current) {
                    const producer = await producerTransportRef.current.produce({ track, appData: { source: 'screen' } });
                    producersRef.current.set('screen', producer);

                    setLocalScreenStream(stream);
                    setIsScreenSharing(true);

                    track.onended = () => {
                        // User clicked stop sharing on browser banner
                        if (producersRef.current.has('screen')) {
                            producersRef.current.get('screen').close();
                            producersRef.current.delete('screen');
                        }
                        setLocalScreenStream(null);
                        setIsScreenSharing(false);
                    };
                }
            }
        } catch (err) {
            console.error("Screen share fail", err);
            setError("Could not share screen");
        }
    };

    return { isJoined, initWebRTC, localStream, localScreenStream, peers, toggleVideo, toggleAudio, toggleScreenShare, isCamOn, isMicOn, isScreenSharing, error, messages, sendMessage };
};

export default useWebRTC;
