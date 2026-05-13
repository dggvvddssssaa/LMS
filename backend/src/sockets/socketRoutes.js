const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const RoomManager = require("./roomManager");
const SessionModel = require("../models/sessionModel");
const EnrollmentRepository = require("../repositories/EnrollmentRepository");
const { getJwtSecret } = require("../utils/jwtSecret");
const { normalizeRole } = require("../utils/roles");

let io;
const roomManager = new RoomManager();

// --- Payload validation helpers ---
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

const validatePayload = (data, fields) => {
    for (const field of fields) {
        if (!data || !isNonEmptyString(data[field])) {
            return `Missing or invalid field: ${field}`;
        }
    }
    return null;
};

// Track socket → session/room mapping for cleanup
const socketSessionMap = new Map(); // socketId → { sessionId, userId, canonicalRoomId }

const initSocket = (httpServer, workers) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
                : "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    // Socket authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication required. No token provided."));
        }

        try {
            const decoded = jwt.verify(token, getJwtSecret());
            decoded.role = normalizeRole(decoded.role);
            socket.user = decoded; // { id, email, role, name }
            next();
        } catch (err) {
            logger.warn(`Socket auth failed: ${err.message}`);
            return next(new Error("Invalid or expired token."));
        }
    });

    io.on("connection", (socket) => {
        logger.info(`Socket connected: ${socket.id} (user: ${socket.user.email}, role: ${socket.user.role})`);

        socket.on("joinRoom", async ({ roomId }, callback) => {
            try {
                const err = validatePayload({ roomId }, ["roomId"]);
                if (err) return callback({ error: err });

                // Resolve session — always use meeting_id as canonical room ID
                let session = await SessionModel.getByMeetingId(roomId);
                if (!session) {
                    session = await SessionModel.getById(roomId);
                }
                if (!session) {
                    return callback({ error: "Phòng học không tồn tại." });
                }

                // Canonical room ID: always meeting_id for consistency
                const canonicalRoomId = session.meeting_id || String(session.id);

                const isAdmin = socket.user.role === 'admin';
                const isSessionTeacher = session.teacher_id === socket.user.id;
                const isCourseInstructor = session.instructor_id === socket.user.id;
                const isTeacher = isAdmin || isSessionTeacher || isCourseInstructor;

                // Student validation
                if (!isTeacher) {
                    const courseId = session.course_id;
                    if (courseId) {
                        const enrollment = await EnrollmentRepository.checkEnrollment(socket.user.id, courseId);
                        if (!enrollment) {
                            return callback({ error: "Bạn chưa đăng ký khóa học này." });
                        }
                    }

                    const status = session.status || 'scheduled';
                    if (status === 'ended' || status === 'cancelled') {
                        return callback({ error: "Lớp học đã kết thúc." });
                    }

                    if (status === 'scheduled') {
                        const now = new Date();
                        const start = new Date(session.start_time);
                        const joinOpenMinutes = session.join_open_minutes || 15;
                        const minutesDiff = (start - now) / 1000 / 60;
                        if (minutesDiff > joinOpenMinutes) {
                            return callback({
                                error: `Lớp chưa mở. Phòng sẽ mở lúc ${start.toLocaleString('vi-VN')} (có thể vào trước ${joinOpenMinutes} phút).`
                            });
                        }
                    }
                }

                // Create or get room using canonical ID
                const room = await roomManager.createOrGetRoom(canonicalRoomId, workers);
                socket.join(canonicalRoomId);

                const rtpCapabilities = room.router.rtpCapabilities;
                const userName = socket.user.name || socket.user.email;
                roomManager.addPeer(canonicalRoomId, socket.id, isTeacher, userName, socket.user.role);

                // Record attendance
                try {
                    await SessionModel.recordJoin(session.id, socket.user.id);
                } catch (e) {
                    logger.warn(`Attendance record failed: ${e.message}`);
                }

                // Store mapping for cleanup
                socketSessionMap.set(socket.id, {
                    sessionId: session.id,
                    userId: socket.user.id,
                    canonicalRoomId
                });

                // Build active peers list
                const activePeers = [];
                for (const [id, peer] of room.peers) {
                    activePeers.push({
                        peerId: id,
                        isTeacher: peer.isTeacher,
                        userName: peer.userName || 'Unknown',
                        role: peer.role || 'student'
                    });
                }

                // Notify others in the canonical room
                socket.to(canonicalRoomId).emit("newPeer", {
                    peerId: socket.id,
                    isTeacher,
                    userName,
                    role: socket.user.role
                });

                logger.info(`Peer ${socket.id} (${userName}) joined room ${canonicalRoomId} as ${isTeacher ? 'teacher' : 'student'}. Total peers: ${room.peers.size}`);

                callback({ rtpCapabilities, activePeers, canonicalRoomId });
            } catch (err) {
                logger.error(`Error joining room: ${err.message}`);
                callback({ error: "Lỗi kết nối máy chủ phòng học." });
            }
        });

        socket.on("createWebRtcTransport", async ({ roomId }, callback) => {
            try {
                // Use canonical room ID from the socket's mapping
                const mapping = socketSessionMap.get(socket.id);
                const effectiveRoomId = mapping?.canonicalRoomId || roomId;

                const err = validatePayload({ roomId: effectiveRoomId }, ["roomId"]);
                if (err) return callback({ error: err });

                const { params } = await roomManager.createWebRtcTransport(effectiveRoomId, socket.id);
                callback(params);
            } catch (err) {
                logger.error(`createWebRtcTransport error: ${err.message}`);
                callback({ error: err.message });
            }
        });

        socket.on("connectTransport", async ({ roomId, transportId, dtlsParameters }, callback) => {
            try {
                const mapping = socketSessionMap.get(socket.id);
                const effectiveRoomId = mapping?.canonicalRoomId || roomId;

                const err = validatePayload({ roomId: effectiveRoomId, transportId }, ["roomId", "transportId"]);
                if (err) return callback({ error: err });

                await roomManager.connectTransport(effectiveRoomId, socket.id, transportId, dtlsParameters);
                callback();
            } catch (err) {
                logger.error(`connectTransport error: ${err.message}`);
                callback({ error: err.message });
            }
        });

        socket.on("produce", async ({ roomId, transportId, kind, rtpParameters, appData }, callback) => {
            try {
                const mapping = socketSessionMap.get(socket.id);
                const effectiveRoomId = mapping?.canonicalRoomId || roomId;

                const err = validatePayload({ roomId: effectiveRoomId, transportId }, ["roomId", "transportId"]);
                if (err) return callback({ error: err });

                appData = appData || {};
                const id = await roomManager.produce(effectiveRoomId, socket.id, transportId, kind, rtpParameters, appData);

                // Broadcast new producer to others with full metadata
                socket.to(effectiveRoomId).emit("newProducer", {
                    producerId: id,
                    peerId: socket.id,
                    kind,
                    appData
                });

                callback({ id });
            } catch (err) {
                logger.error(`produce error: ${err.message}`);
                callback({ error: err.message });
            }
        });

        socket.on("consume", async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
            try {
                const mapping = socketSessionMap.get(socket.id);
                const effectiveRoomId = mapping?.canonicalRoomId || roomId;

                const err = validatePayload({ roomId: effectiveRoomId, transportId, producerId }, ["roomId", "transportId", "producerId"]);
                if (err) return callback({ error: err });

                const params = await roomManager.consume(effectiveRoomId, socket.id, transportId, producerId, rtpCapabilities);
                callback(params);
            } catch (err) {
                logger.error(`consume error: ${err.message}`);
                callback({ error: err.message });
            }
        });

        socket.on("resume", async ({ roomId, consumerId }, callback) => {
            try {
                const mapping = socketSessionMap.get(socket.id);
                const effectiveRoomId = mapping?.canonicalRoomId || roomId;

                const err = validatePayload({ roomId: effectiveRoomId, consumerId }, ["roomId", "consumerId"]);
                if (err) return callback({ error: err });

                await roomManager.resumeConsumer(effectiveRoomId, socket.id, consumerId);
                callback();
            } catch (err) {
                logger.error(`resume error: ${err.message}`);
                callback({ error: err.message });
            }
        });

        // ---- Producer lifecycle: close/pause/resume ----
        // THIS IS THE CRITICAL FIX: client must call closeProducer when toggling cam/mic off,
        // otherwise the server-side producer stays alive and remote consumers never get 'producerclose'

        socket.on("closeProducer", ({ producerId }, callback) => {
            try {
                const mapping = socketSessionMap.get(socket.id);
                const effectiveRoomId = mapping?.canonicalRoomId;
                if (!effectiveRoomId) return callback?.({ error: 'Not in a room' });

                const result = roomManager.closeProducer(effectiveRoomId, socket.id, producerId);
                if (!result) {
                    return callback?.({ error: 'Producer not found' });
                }

                // Broadcast to all other peers so they can update UI immediately
                // (in addition to the mediasoup-level 'producerclose' on consumers)
                socket.to(effectiveRoomId).emit("producerClosed", {
                    peerId: socket.id,
                    producerId,
                    kind: result.kind,
                    source: result.appData?.source || 'camera'
                });

                logger.info(`closeProducer: ${producerId} kind=${result.kind} source=${result.appData?.source || 'camera'} (room=${effectiveRoomId}, peer=${socket.id})`);
                callback?.({ success: true });
            } catch (err) {
                logger.error(`closeProducer error: ${err.message}`);
                callback?.({ error: err.message });
            }
        });

        socket.on("pauseProducer", async ({ producerId }, callback) => {
            try {
                const mapping = socketSessionMap.get(socket.id);
                const effectiveRoomId = mapping?.canonicalRoomId;
                if (!effectiveRoomId) return callback?.({ error: 'Not in a room' });

                const result = await roomManager.pauseProducer(effectiveRoomId, socket.id, producerId);
                if (!result) return callback?.({ error: 'Producer not found' });

                socket.to(effectiveRoomId).emit("producerPaused", {
                    peerId: socket.id,
                    producerId,
                    kind: result.kind,
                    source: result.appData?.source || 'camera'
                });

                callback?.({ success: true });
            } catch (err) {
                logger.error(`pauseProducer error: ${err.message}`);
                callback?.({ error: err.message });
            }
        });

        socket.on("resumeProducer", async ({ producerId }, callback) => {
            try {
                const mapping = socketSessionMap.get(socket.id);
                const effectiveRoomId = mapping?.canonicalRoomId;
                if (!effectiveRoomId) return callback?.({ error: 'Not in a room' });

                const result = await roomManager.resumeProducer(effectiveRoomId, socket.id, producerId);
                if (!result) return callback?.({ error: 'Producer not found' });

                socket.to(effectiveRoomId).emit("producerResumed", {
                    peerId: socket.id,
                    producerId,
                    kind: result.kind,
                    source: result.appData?.source || 'camera'
                });

                callback?.({ success: true });
            } catch (err) {
                logger.error(`resumeProducer error: ${err.message}`);
                callback?.({ error: err.message });
            }
        });

        socket.on("getProducers", ({ roomId }, callback) => {
            const mapping = socketSessionMap.get(socket.id);
            const effectiveRoomId = mapping?.canonicalRoomId || roomId;

            const err = validatePayload({ roomId: effectiveRoomId }, ["roomId"]);
            if (err) return callback([]);

            const producers = roomManager.getProducers(effectiveRoomId);
            const filtered = producers.filter(p => p.peerId !== socket.id);
            callback(filtered);
        });

        // Debug: get room state (admin only)
        socket.on("getRoomState", ({ roomId }, callback) => {
            if (socket.user.role !== 'admin') return callback({ error: 'Admin only' });
            const mapping = socketSessionMap.get(socket.id);
            const effectiveRoomId = mapping?.canonicalRoomId || roomId;
            const state = roomManager.getRoomState(effectiveRoomId);
            callback(state || { error: 'Room not found' });
        });

        socket.on("chatMessage", (data) => {
            if (!data || !isNonEmptyString(data.text)) return;

            // Use canonical room from mapping
            const mapping = socketSessionMap.get(socket.id);
            const effectiveRoomId = mapping?.canonicalRoomId || data.roomId;
            if (!effectiveRoomId) return;

            io.to(effectiveRoomId).emit("chatMessage", {
                roomId: effectiveRoomId,
                text: data.text,
                senderName: socket.user.name || socket.user.email,
                senderId: socket.user.id,
                senderRole: socket.user.role,
            });
        });

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: ${socket.id}`);

            const mapping = socketSessionMap.get(socket.id);

            // Record leave attendance
            if (mapping) {
                SessionModel.recordLeave(mapping.sessionId, mapping.userId)
                    .catch(e => logger.warn(`Attendance leave record failed: ${e.message}`));

                // Notify peers in canonical room
                if (mapping.canonicalRoomId) {
                    socket.to(mapping.canonicalRoomId).emit("peerLeft", { peerId: socket.id });
                }

                socketSessionMap.delete(socket.id);
            }

            // Clean up mediasoup resources
            roomManager.removePeer(socket.id);
        });
    });
};

module.exports = { initSocket };
