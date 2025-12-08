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
const users = {};
const socketToRoom = {};
const whiteboardHistory = {};
const currentSlide = {};

io.on("connection", (socket) => {
  socket.on("join_room", ({ roomId, username, mediaStatus }) => {
    socket.join(roomId);
    users[socket.id] = { roomId, username, mediaStatus };
    socketToRoom[socket.id] = roomId;

    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const otherUsers = usersInRoom.filter((id) => id !== socket.id);

    const usersPayload = otherUsers.map((id) => ({
      id,
      username: users[id]?.username || "Anonymous",
      mediaStatus: users[id]?.mediaStatus || { video: true, audio: true },
    }));

    socket.emit("all_users", usersPayload);

    if (whiteboardHistory[roomId])
      socket.emit("whiteboard_history", whiteboardHistory[roomId]);
    if (currentSlide[roomId]) socket.emit("slide_change", currentSlide[roomId]);
  });

  socket.on("sending_signal", (payload) => {
    io.to(payload.userToCall).emit("user_joined", {
      signal: payload.signal,
      callerID: payload.callerID,
      callerUsername: users[payload.callerID]?.username,
      mediaStatus: users[payload.callerID]?.mediaStatus,
      isScreen: payload.isScreen,
    });
  });

  socket.on("returning_signal", (payload) => {
    io.to(payload.callerID).emit("receiving_returned_signal", {
      signal: payload.signal,
      id: socket.id,
      isScreen: payload.isScreen,
    });
  });

  socket.on("user_media_update", ({ userId, status }) => {
    const roomId = users[socket.id]?.roomId;
    if (users[socket.id]) users[socket.id].mediaStatus = status;
    if (roomId) socket.to(roomId).emit("user_media_update", { userId, status });
  });

  // --- FIX: THÊM SỰ KIỆN STOP SHARE ---
  socket.on("stop_screen_share", () => {
    const roomId = users[socket.id]?.roomId;
    if (roomId) {
      // Báo cho mọi người biết user này đã tắt màn hình
      socket.to(roomId).emit("user_stopped_screen", socket.id);
    }
  });

  // Whiteboard Logic
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
