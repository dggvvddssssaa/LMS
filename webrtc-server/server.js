const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// State
const users = {}; // id -> { roomId, username, mediaStatus }
const socketToRoom = {};
const whiteboardHistory = {};
const currentSlide = {};

io.on("connection", (socket) => {
  // 1. Join Room: Nhận thêm mediaStatus (mic/cam ban đầu)
  socket.on("join_room", ({ roomId, username, mediaStatus }) => {
    socket.join(roomId);

    // Lưu trạng thái ban đầu
    users[socket.id] = { roomId, username, mediaStatus };
    socketToRoom[socket.id] = roomId;

    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const otherUsers = usersInRoom.filter((id) => id !== socket.id);

    // Gửi danh sách người cũ (kèm mediaStatus) cho người mới
    const usersPayload = otherUsers.map((id) => ({
      id,
      username: users[id]?.username || "Anonymous",
      mediaStatus: users[id]?.mediaStatus || { video: true, audio: true }, // Mặc định true
    }));

    socket.emit("all_users", usersPayload);

    // Gửi Whiteboard history (nếu có)
    if (whiteboardHistory[roomId])
      socket.emit("whiteboard_history", whiteboardHistory[roomId]);
    if (currentSlide[roomId]) socket.emit("slide_change", currentSlide[roomId]);
  });

  // 2. Logic WebRTC (Cập nhật để gửi kèm mediaStatus của người gọi)
  socket.on("sending_signal", (payload) => {
    io.to(payload.userToCall).emit("user_joined", {
      signal: payload.signal,
      callerID: payload.callerID,
      callerUsername: users[payload.callerID]?.username,
      mediaStatus: users[payload.callerID]?.mediaStatus, // Gửi trạng thái mic/cam
    });
  });

  socket.on("returning_signal", (payload) => {
    io.to(payload.callerID).emit("receiving_returned_signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  // 3. Sync Media Status (Khi user tắt/bật mic/cam)
  socket.on("media_status_change", (status) => {
    const roomId = users[socket.id]?.roomId;
    if (users[socket.id]) {
      users[socket.id].mediaStatus = status; // Cập nhật server
    }
    if (roomId) {
      // Báo cho mọi người trong phòng biết
      socket
        .to(roomId)
        .emit("user_media_update", { userId: socket.id, status });
    }
  });

  // ... (Giữ nguyên logic Whiteboard: request, draw, clear, slide) ...
  socket.on("request_whiteboard", () => {
    const roomId = users[socket.id]?.roomId;
    if (roomId && whiteboardHistory[roomId])
      socket.emit("whiteboard_history", whiteboardHistory[roomId]);
    if (roomId && currentSlide[roomId])
      socket.emit("slide_change", currentSlide[roomId]);
  });
  socket.on("draw", (data) => {
    const roomId = users[socket.id]?.roomId;
    if (roomId) {
      if (!whiteboardHistory[roomId]) whiteboardHistory[roomId] = [];
      whiteboardHistory[roomId].push(data);
      socket.to(roomId).emit("draw", data);
    }
  });
  socket.on("clear_board", () => {
    const roomId = users[socket.id]?.roomId;
    if (roomId) {
      whiteboardHistory[roomId] = [];
      io.to(roomId).emit("clear_board");
    }
  });
  socket.on("change_slide", (imgData) => {
    const roomId = users[socket.id]?.roomId;
    if (roomId) {
      currentSlide[roomId] = imgData;
      io.to(roomId).emit("slide_change", imgData);
    }
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    delete users[socket.id];
    delete socketToRoom[socket.id];
    if (roomId) socket.to(roomId).emit("user_left", socket.id);
  });
});

server.listen(3001, () => console.log("Server running on 3001"));
