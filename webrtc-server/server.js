const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json()); // Để đọc JSON body

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const prisma = new PrismaClient();

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

// --- API ROUTES (LMS Logic) ---

// 1. Register
app.post("/api/register", async (req, res) => {
  const { email, password, name, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || "STUDENT" },
    });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

// 2. Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    SECRET
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

// 3. Get Courses (Lấy danh sách khóa học)
app.get("/api/courses", async (req, res) => {
  const courses = await prisma.course.findMany({
    include: { teacher: { select: { name: true } } },
  });
  res.json(courses);
});

// 4. Create Course (Chỉ Teacher)
app.post("/api/courses", authenticate, async (req, res) => {
  if (req.user.role !== "TEACHER")
    return res.status(403).json({ error: "Only teachers" });
  const { title, description } = req.body;
  const course = await prisma.course.create({
    data: { title, description, teacherId: req.user.id },
  });
  res.json(course);
});

// --- SOCKET IO LOGIC (Video Call - Copy phần cũ vào đây) ---
// Giữ nguyên toàn bộ logic socket của bạn ở bài trước
const users = {};
const socketToRoom = {};
const whiteboardHistory = {};
const currentSlide = {};

io.on("connection", (socket) => {
  // ... (Paste toàn bộ phần logic socket.on('join_room'), 'sending_signal'... của bài trước vào đây)
  // Lưu ý: Ở logic cũ, client gửi roomId. Bây giờ roomId chính là Course ID (VD: "course-1")

  socket.on("join_room", ({ roomId, username, mediaStatus }) => {
    // Logic cũ...
    socket.join(roomId);
    users[socket.id] = { roomId, username, mediaStatus };
    socketToRoom[socket.id] = roomId;
    // ... (Giữ nguyên code socket cũ)
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

  // ... (Paste các event socket khác: sending_signal, returning_signal, draw, stop_screen_share...)
  // CODE SOCKET GIỮ NGUYÊN NHƯ BÀI TRƯỚC
  // CHỈ CẦN COPY-PASTE VÀO ĐÂY

  // (Tôi viết tắt đoạn này để tiết kiệm chỗ, bạn hãy dùng code server.js full của bài trước nhé)
  socket.on("sending_signal", (p) =>
    io
      .to(p.userToCall)
      .emit("user_joined", {
        signal: p.signal,
        callerID: p.callerID,
        callerUsername: users[p.callerID]?.username,
        mediaStatus: users[p.callerID]?.mediaStatus,
        isScreen: p.isScreen,
      })
  );
  socket.on("returning_signal", (p) =>
    io
      .to(p.callerID)
      .emit("receiving_returned_signal", {
        signal: p.signal,
        id: socket.id,
        isScreen: p.isScreen,
      })
  );
  socket.on("media_status_change", (s) => {
    if (users[socket.id]) users[socket.id].mediaStatus = s;
    const r = users[socket.id]?.roomId;
    if (r)
      socket.to(r).emit("user_media_update", { userId: socket.id, status: s });
  });
  socket.on("stop_screen_share", () => {
    const r = users[socket.id]?.roomId;
    if (r) socket.to(r).emit("user_stopped_screen", socket.id);
  });
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
    const r = socketToRoom[socket.id];
    delete users[socket.id];
    delete socketToRoom[socket.id];
    if (r) socket.to(r).emit("user_left", socket.id);
  });
});

server.listen(3001, () => console.log("LMS Server running on 3001"));
