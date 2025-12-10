require("dotenv").config(); // Load biến môi trường
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const prisma = new PrismaClient(); // Tự động load URL từ .env

const SECRET = process.env.JWT_SECRET || "secret";

// --- MIDDLEWARE AUTH ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch (e) {
    res.status(403).json({ error: "Invalid Token" });
  }
};

// --- API ROUTES ---
app.post("/api/register", async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || "STUDENT" },
    });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: "Email đã tồn tại" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
  }
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    SECRET
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

app.get("/api/courses", async (req, res) => {
  const courses = await prisma.course.findMany({
    include: { teacher: { select: { name: true } } },
  });
  res.json(courses);
});

app.post("/api/courses", authenticate, async (req, res) => {
  if (req.user.role !== "TEACHER")
    return res
      .status(403)
      .json({ error: "Chỉ giáo viên mới được tạo khóa học" });
  const { title, description } = req.body;
  const course = await prisma.course.create({
    data: { title, description, teacherId: req.user.id },
  });
  res.json(course);
});

// --- SOCKET IO LOGIC (VIDEO CALL) ---
const users = {};
const socketToRoom = {};
const whiteboardHistory = {};
const currentSlide = {};

io.on("connection", (socket) => {
  socket.on("join_room", ({ roomId, username, mediaStatus }) => {
    socket.join(roomId);

    // Lưu trạng thái Media ban đầu (Video: true/false, Audio: true/false)
    users[socket.id] = {
      roomId,
      username,
      mediaStatus: mediaStatus || { video: true, audio: true },
    };
    socketToRoom[socket.id] = roomId;

    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const otherUsers = usersInRoom.filter((id) => id !== socket.id);

    // Gửi danh sách người cũ KÈM THEO trạng thái mediaStatus của họ cho người mới
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
      mediaStatus: users[payload.callerID]?.mediaStatus, // Gửi trạng thái của người gọi
      isScreen: payload.isScreen,
    });
  });

  // --- FIX QUAN TRỌNG TẠI ĐÂY ---
  socket.on("returning_signal", (payload) => {
    io.to(payload.callerID).emit("receiving_returned_signal", {
      signal: payload.signal,
      id: socket.id,
      isScreen: payload.isScreen,
      // THÊM DÒNG NÀY: Gửi kèm trạng thái media của người trả lời (Receiver)
      mediaStatus: users[socket.id]?.mediaStatus,
    });
  });

  // Sự kiện cập nhật Mic/Cam riêng biệt
  socket.on("media_status_change", (status) => {
    // status dạng: { video: boolean, audio: boolean }
    if (users[socket.id]) {
      users[socket.id].mediaStatus = status; // Cập nhật bộ nhớ server
    }
    const roomId = users[socket.id]?.roomId;
    if (roomId) {
      // Báo cho tất cả mọi người trong phòng cập nhật icon
      socket
        .to(roomId)
        .emit("user_media_update", { userId: socket.id, status });
    }
  });

  socket.on("stop_screen_share", () => {
    const roomId = users[socket.id]?.roomId;
    if (roomId) socket.to(roomId).emit("user_stopped_screen", socket.id);
  });

  // Whiteboard
  socket.on("request_whiteboard", () => {
    const r = users[socket.id]?.roomId;
    if (r && whiteboardHistory[r])
      socket.emit("whiteboard_history", whiteboardHistory[r]);
    if (r && currentSlide[r]) socket.emit("slide_change", currentSlide[r]);
  });
  socket.on("draw", (d) => {
    const r = users[socket.id]?.roomId;
    if (r) {
      if (!whiteboardHistory[r]) whiteboardHistory[r] = [];
      whiteboardHistory[r].push(d);
      socket.to(r).emit("draw", d);
    }
  });
  socket.on("clear_board", () => {
    const r = users[socket.id]?.roomId;
    if (r) {
      whiteboardHistory[r] = [];
      io.to(r).emit("clear_board");
    }
  });
  socket.on("change_slide", (d) => {
    const r = users[socket.id]?.roomId;
    if (r) {
      currentSlide[r] = d;
      io.to(r).emit("slide_change", d);
    }
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    delete users[socket.id];
    delete socketToRoom[socket.id];
    if (roomId) socket.to(roomId).emit("user_left", socket.id);
  });
});

server.listen(3001, () => console.log("LMS Server running on 3001"));
