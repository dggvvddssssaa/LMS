require("dotenv").config();
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
const prisma = new PrismaClient();

const SECRET = process.env.JWT_SECRET || "secret_lms_key";

// ==========================================
// 1. MIDDLEWARES (Bảo vệ & Phân quyền)
// ==========================================

// Kiểm tra đăng nhập
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Vui lòng đăng nhập!" });

  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch (e) {
    res.status(403).json({ error: "Token không hợp lệ" });
  }
};

// Kiểm tra quyền (Role)
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền thực hiện hành động này!" });
    }
    next();
  };
};

// ==========================================
// 2. API ROUTES (LMS Logic)
// ==========================================

// --- AUTH ---
app.post("/api/register", async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Mặc định là STUDENT nếu không chọn role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "STUDENT",
      },
    });
    res.json({
      message: "Đăng ký thành công",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    res.status(400).json({ error: "Email đã tồn tại" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// --- COURSES (Quản lý khóa học) ---

// 1. Lấy danh sách tất cả khóa học
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { instructor: { select: { name: true } } },
    });
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: "Lỗi lấy danh sách khóa học" });
  }
});

// 2. Lấy CHI TIẾT khóa học (Logic quan trọng: Ẩn video nếu chưa mua)
app.get("/api/courses/:id", authenticate, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true, name: true } },
        lessons: { orderBy: { order: "asc" } }, // Lấy danh sách bài học
        students: { where: { userId: userId } }, // Kiểm tra xem user này có trong danh sách mua không
      },
    });

    if (!course)
      return res.status(404).json({ error: "Khóa học không tồn tại" });

    // Kiểm tra quyền truy cập
    const isInstructor = course.instructorId === userId;
    const isEnrolled = course.students.length > 0;
    const isAdmin = req.user.role === "ADMIN";
    const hasAccess = isInstructor || isEnrolled || isAdmin;

    // Nếu chưa mua -> Che link video và nội dung chi tiết
    if (!hasAccess) {
      course.lessons = course.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        videoUrl: null, // 🔒 CHE LINK VIDEO
        content: "Bạn cần đăng ký khóa học để xem nội dung này.", // 🔒 CHE NỘI DUNG
        isLocked: true,
      }));
    }

    res.json({ ...course, isEnrolled, isInstructor });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lỗi lấy thông tin khóa học" });
  }
});

// 3. Tạo khóa học mới (Chỉ GV/Admin)
app.post(
  "/api/courses",
  authenticate,
  checkRole(["INSTRUCTOR", "ADMIN"]),
  async (req, res) => {
    const { title, description, price, thumbnail } = req.body;
    try {
      const course = await prisma.course.create({
        data: {
          title,
          description,
          thumbnail,
          price: parseFloat(price) || 0,
          instructorId: req.user.id,
        },
      });
      res.json(course);
    } catch (e) {
      res.status(500).json({ error: "Lỗi tạo khóa học" });
    }
  }
);

// 4. Thêm bài học vào khóa học (Chỉ GV sở hữu khóa học/Admin)
app.post(
  "/api/courses/:id/lessons",
  authenticate,
  checkRole(["INSTRUCTOR", "ADMIN"]),
  async (req, res) => {
    const courseId = parseInt(req.params.id);
    const { title, content, videoUrl } = req.body;

    try {
      // Check xem có phải chủ khóa học không
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course)
        return res.status(404).json({ error: "Khóa học không tồn tại" });

      if (course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Bạn không phải giảng viên của khóa này" });
      }

      const lesson = await prisma.lesson.create({
        data: { title, content, videoUrl, courseId },
      });
      res.json(lesson);
    } catch (e) {
      res.status(500).json({ error: "Lỗi thêm bài học" });
    }
  }
);

// 5. Đăng ký (Mua) khóa học
app.post("/api/courses/:id/enroll", authenticate, async (req, res) => {
  const courseId = parseInt(req.params.id);
  const userId = req.user.id;
  try {
    // Check đã mua chưa
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }, // Yêu cầu @unique([userId, courseId]) trong schema
    });

    if (existing)
      return res.status(400).json({ error: "Bạn đã đăng ký khóa học này rồi" });

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
    });
    res.json({ message: "Đăng ký thành công!", enrollment });
  } catch (e) {
    res.status(500).json({ error: "Lỗi đăng ký khóa học" });
  }
});

// ==========================================
// 3. SOCKET IO LOGIC (WebRTC Video Call)
// ==========================================
const users = {};
const socketToRoom = {};
const whiteboardHistory = {};
const currentSlide = {};

io.on("connection", (socket) => {
  // Join Room
  socket.on("join_room", ({ roomId, username, mediaStatus }) => {
    socket.join(roomId);
    users[socket.id] = {
      roomId,
      username,
      mediaStatus: mediaStatus || { video: true, audio: true },
    };
    socketToRoom[socket.id] = roomId;

    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const otherUsers = usersInRoom.filter((id) => id !== socket.id);

    // Gửi danh sách người cũ KÈM mediaStatus cho người mới
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

  // WebRTC Signaling
  socket.on("sending_signal", (payload) => {
    // Check an toàn
    if (io.sockets.sockets.get(payload.userToCall)) {
      io.to(payload.userToCall).emit("user_joined", {
        signal: payload.signal,
        callerID: payload.callerID,
        callerUsername: users[payload.callerID]?.username,
        mediaStatus: users[payload.callerID]?.mediaStatus,
        isScreen: payload.isScreen,
      });
    }
  });

  socket.on("returning_signal", (payload) => {
    // Check an toàn
    if (io.sockets.sockets.get(payload.callerID)) {
      io.to(payload.callerID).emit("receiving_returned_signal", {
        signal: payload.signal,
        id: socket.id,
        isScreen: payload.isScreen,
        mediaStatus: users[socket.id]?.mediaStatus, // QUAN TRỌNG: Gửi lại trạng thái mic/cam của người nhận
      });
    }
  });

  // Cập nhật Mic/Cam
  socket.on("media_status_change", (status) => {
    if (users[socket.id]) users[socket.id].mediaStatus = status;
    const roomId = users[socket.id]?.roomId;
    if (roomId)
      socket
        .to(roomId)
        .emit("user_media_update", { userId: socket.id, status });
  });

  // Stop Share Screen
  socket.on("stop_screen_share", () => {
    const roomId = users[socket.id]?.roomId;
    if (roomId) socket.to(roomId).emit("user_stopped_screen", socket.id);
  });

  // Whiteboard Logic
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

  // Disconnect an toàn (Chống sập server)
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const roomId = user.roomId;
      delete users[socket.id];
      delete socketToRoom[socket.id];
      if (roomId) socket.to(roomId).emit("user_left", socket.id);
    }
  });
});

// --- BẮT LỖI TOÀN CỤC (CHỐNG SẬP SERVER) ---
process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("🔥 Uncaught Exception:", error);
});

const PORT = 3001;
server.listen(PORT, () =>
  console.log(`🚀 LMS Server + WebRTC running on port ${PORT}`)
);
