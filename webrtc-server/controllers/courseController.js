// controllers/courseController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. Tạo khóa học (Chỉ Instructor)
const createCourse = async (req, res) => {
  try {
    const { title, description, price, thumbnail } = req.body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price) || 0,
        thumbnail,
        instructorId: req.user.id, // Lấy ID từ token
      },
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: "Failed to create course" });
  }
};

// 2. Thêm bài học vào khóa học
const addLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, videoUrl } = req.body;

    // Kiểm tra xem người thêm có phải là chủ khóa học không
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });
    if (!course || course.instructorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this course" });
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        courseId: parseInt(courseId),
      },
    });
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: "Failed to add lesson" });
  }
};

// 3. Lấy chi tiết khóa học (Logic ẩn video)
const getCourseDetail = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { name: true, email: true } },
        lessons: { orderBy: { order: "asc" } }, // Lấy danh sách bài học
        liveSessions: true, // Lấy danh sách buổi live
      },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    // Kiểm tra xem User đã mua khóa học chưa
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    const isInstructor = course.instructorId === userId;
    const isAdmin = req.user.role === "ADMIN";
    const hasAccess = enrollment || isInstructor || isAdmin;

    // Nếu chưa mua, ẩn link video và nội dung chi tiết
    if (!hasAccess) {
      course.lessons = course.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        videoUrl: null, // Che link video
        content: "Please enroll to view content", // Che nội dung
        isLocked: true,
      }));
    }

    res.json({ ...course, isEnrolled: !!enrollment, isInstructor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
};

// 4. Đăng ký/Mua khóa học
const enrollCourse = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check duplicate
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) return res.status(400).json({ error: "Already enrolled" });

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
    });

    res.status(201).json({ message: "Enrolled successfully", enrollment });
  } catch (error) {
    res.status(500).json({ error: "Enrollment failed" });
  }
};

// Lấy danh sách tất cả khóa học (Public)
const getCourses = async (req, res) => {
  const courses = await prisma.course.findMany({
    include: { instructor: { select: { name: true } } },
  });
  res.json(courses);
};

module.exports = {
  createCourse,
  addLesson,
  getCourseDetail,
  enrollCourse,
  getCourses,
};
