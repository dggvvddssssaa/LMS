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

const initSocket = (httpServer, workers) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
                : "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    // Socket authentication middleware — validate JWT before allowing connection
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication required. No token provided."));
        }

        try {
            const decoded = jwt.verify(token, getJwtSecret());
            decoded.role = normalizeRole(decoded.role);
            socket.user = decoded; // { id, email, role }
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
                // Validate payload
                const err = validatePayload({ roomId }, ["roomId"]);
                if (err) return callback({ error: err });

                // Derive isTeacher from authenticated token — never trust client
                const isTeacher = socket.user.role === 'instructor' || socket.user.role === 'admin';

                // Room validation: try meeting_id first (UUID from links), then fall back to id
                let session = await SessionModel.getByMeetingId(roomId);
                if (!session) {
                    session = await SessionModel.getById(roomId);
                }
                if (!session) {
                    return callback({ error: "Phòng học không tồn tại." });
                }

                // Enrollment check for students
                if (!isTeacher) {
                    const courseId = session.course_id || (session.live_class_id ? null : null);
                    if (courseId) {
                        const enrollment = await EnrollmentRepository.checkEnrollment(socket.user.id, courseId);
                        if (!enrollment) {
                            return callback({ error: "Bạn chưa đăng ký khóa học này." });
                        }
                    }

                    const now = new Date();
                    const start = new Date(session.start_time);
                    const minutesDiff = (start - now) / 1000 / 60;
                    if (minutesDiff > 5) { // Only allow joining 5 mins early
                        return callback({ error: `Phòng chưa mở. Vui lòng quay lại lúc ${start.toLocaleString()}` });
                    }
                }

                const room = await roomManager.createOrGetRoom(roomId, workers);
                // Join socket room
                socket.join(roomId);

                // Get RtpCapabilities for the client
                const rtpCapabilities = room.router.rtpCapabilities;

                // Add peer to room logic
                roomManager.addPeer(roomId, socket.id, isTeacher);

                // Gửi lại danh sách những người đang có sẵn trong room (bao gồm cả người vừa vào)
                const activePeers = Array.from(room.peers.keys()).map(id => ({ peerId: id, isTeacher: room.peers.get(id).isTeacher }));

                // Báo cho mọi người khác là có người mới vào phòng
                socket.to(roomId).emit("newPeer", { peerId: socket.id, isTeacher });

                callback({ rtpCapabilities, activePeers });
            } catch (err) {
                logger.error(`Error joining room: ${err.message}`);
                callback({ error: "Lỗi kết nối máy chủ phòng học." });
            }
        });

        socket.on("createWebRtcTransport", async ({ roomId }, callback) => {
            try {
                const err = validatePayload({ roomId }, ["roomId"]);
                if (err) return callback({ error: err });

                const { params } = await roomManager.createWebRtcTransport(roomId, socket.id);
                callback(params);
            } catch (err) {
                logger.error(`createWebRtcTransport error: ${err.message}`);
                callback({ error: err.message });
            }
        });

        socket.on("connectTransport", async ({ roomId, transportId, dtlsParameters }, callback) => {
            const err = validatePayload({ roomId, transportId }, ["roomId", "transportId"]);
            if (err) return callback({ error: err });

            await roomManager.connectTransport(roomId, socket.id, transportId, dtlsParameters);
            callback();
        });

        socket.on("produce", async ({ roomId, transportId, kind, rtpParameters, appData }, callback) => {
            const err = validatePayload({ roomId, transportId }, ["roomId", "transportId"]);
            if (err) return callback({ error: err });

            appData = appData || {}; // ensure appData
            const id = await roomManager.produce(roomId, socket.id, transportId, kind, rtpParameters, appData);

            // Broadcast to others in room that a new producer exists
            socket.to(roomId).emit("newProducer", { producerId: id, peerId: socket.id, kind, appData });

            callback({ id });
        });

        socket.on("consume", async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
            try {
                const err = validatePayload({ roomId, transportId, producerId }, ["roomId", "transportId", "producerId"]);
                if (err) return callback({ error: err });

                const params = await roomManager.consume(roomId, socket.id, transportId, producerId, rtpCapabilities);
                callback(params);
            } catch (err) {
                logger.error(`consume error: ${err.message}`);
                callback({ error: err.message });
            }
        });

        socket.on("resume", async ({ roomId, consumerId }, callback) => {
            try {
                const err = validatePayload({ roomId, consumerId }, ["roomId", "consumerId"]);
                if (err) return callback({ error: err });

                await roomManager.resumeConsumer(roomId, socket.id, consumerId);
                callback();
            } catch (err) {
                logger.error(`resume error: ${err.message}`);
                callback({ error: err.message });
            }
        });

        socket.on("getProducers", ({ roomId }, callback) => {
            const err = validatePayload({ roomId }, ["roomId"]);
            if (err) return callback({ error: err });

            const producers = roomManager.getProducers(roomId);
            callback(producers);
        });

        socket.on("chatMessage", (data) => {
            // Validate required fields
            if (!data || !isNonEmptyString(data.roomId) || !isNonEmptyString(data.text)) {
                return; // silently ignore invalid messages
            }
            // Override senderName from authenticated user — never trust client
            io.to(data.roomId).emit("chatMessage", {
                roomId: data.roomId,
                text: data.text,
                senderName: socket.user.email,
                senderId: socket.user.id,
            });
        });

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: ${socket.id}`);

            // Tìm các phòng mà socket này đang tham gia trước khi xóa
            roomManager.rooms.forEach((room, roomId) => {
                if (room.peers && room.peers.has(socket.id)) {
                    socket.to(roomId).emit("peerLeft", { peerId: socket.id });
                }
            });

            roomManager.removePeer(socket.id);
        });
    });
};

module.exports = { initSocket };
