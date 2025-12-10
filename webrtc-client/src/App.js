import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "./components/Layout";
import CourseList from "./components/CourseList";
import CoursePlayer from "./components/CoursePlayer";
import ClassRoom from "./ClassRoom"; // Component WebRTC

function App() {
  // 1. Khởi tạo State từ LocalStorage
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );

  // State điều hướng và dữ liệu
  const [view, setView] = useState("dashboard"); // dashboard, player, live-room
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [liveRoomId, setLiveRoomId] = useState(null);

  // State Form Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");

  // 2. Tải danh sách khóa học khi có Token
  useEffect(() => {
    if (token) fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/courses");
      setCourses(res.data);
    } catch (e) {
      console.error("Lỗi tải khóa học:", e);
    }
  };

  // 3. Xử lý Đăng nhập / Đăng ký
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? "/api/register" : "/api/login";
      // Lưu ý: Mặc định đăng ký là STUDENT. Muốn là INSTRUCTOR thì sửa ở đây hoặc sửa trong DB.
      const payload = isRegister
        ? { email, password, name, role: "STUDENT" }
        : { email, password };

      const res = await axios.post(`http://localhost:3001${endpoint}`, payload);

      if (!isRegister) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        alert("Đăng ký thành công! Hãy đăng nhập.");
        setIsRegister(false);
      }
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || "Lỗi kết nối"));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setView("dashboard");
  };

  // 4. HÀM TẠO KHÓA HỌC (ĐÃ BỔ SUNG)
  const createCourse = async () => {
    const title = prompt("Nhập tên khóa học mới:");
    if (!title) return;

    const priceStr = prompt("Nhập giá tiền (VNĐ):", "0");
    const description = prompt("Mô tả ngắn:", "Khóa học trực tuyến...");
    const thumbnail = "https://via.placeholder.com/300"; // Ảnh giả lập

    try {
      await axios.post(
        "http://localhost:3001/api/courses",
        {
          title,
          description,
          price: parseFloat(priceStr) || 0,
          thumbnail,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Tạo khóa học thành công!");
      fetchCourses(); // Tải lại danh sách
    } catch (e) {
      console.error(e);
      alert("❌ Lỗi: " + (e.response?.data?.error || "Không thể tạo khóa học"));
    }
  };

  // 5. Vào lớp học (WebRTC)
  const joinLiveClass = (courseId) => {
    setLiveRoomId(courseId);
    setView("live-room");
  };

  // 6. Xem nội dung bài giảng
  const viewCourseContent = async (courseId) => {
    try {
      const res = await axios.get(
        `http://localhost:3001/api/courses/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setActiveCourse(res.data);
      setView("player");
    } catch (e) {
      alert("Bạn cần mua khóa học để xem nội dung!");
    }
  };

  // --- RENDER ---

  // Màn hình Login
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-500">
            {isRegister ? "Đăng Ký LMS" : "Đăng Nhập LMS"}
          </h2>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <input
                className="w-full p-3 bg-gray-700 text-white rounded outline-none"
                placeholder="Tên hiển thị"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="w-full p-3 bg-gray-700 text-white rounded outline-none"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full p-3 bg-gray-700 text-white rounded outline-none"
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">
              {isRegister ? "Đăng Ký" : "Đăng Nhập"}
            </button>
          </form>
          <p
            className="mt-4 text-center text-sm text-gray-400 cursor-pointer hover:underline"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </p>
        </div>
      </div>
    );
  }

  // Màn hình WebRTC Live Room
  if (view === "live-room") {
    return (
      <ClassRoom
        user={user}
        courseId={liveRoomId}
        onLeave={() => setView("dashboard")}
      />
    );
  }

  // Màn hình Dashboard
  return (
    <Layout user={user} onLogout={handleLogout} onNavigate={setView}>
      {view === "dashboard" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Khám phá khóa học
            </h2>

            {/* Nút Tạo Khóa Học (Chỉ hiện với INSTRUCTOR/ADMIN) */}
            {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
              <button
                onClick={createCourse} // ĐÃ CÓ HÀM XỬ LÝ
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2"
              >
                <span>+</span> Tạo khóa mới
              </button>
            )}
          </div>

          <CourseList courses={courses} onJoinCourse={joinLiveClass} />
        </>
      )}

      {view === "player" && activeCourse && (
        <CoursePlayer
          course={activeCourse}
          onBack={() => setView("dashboard")}
        />
      )}
    </Layout>
  );
}

export default App;
