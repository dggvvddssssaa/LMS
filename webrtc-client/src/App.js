import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "./components/Layout";
import CourseList from "./components/CourseList";
import CourseManager from "./components/CourseManager"; // Import cái mới
import ClassRoom from "./ClassRoom";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );

  // State điều hướng
  const [view, setView] = useState("dashboard"); // dashboard | manager | live-room
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [liveRoomId, setLiveRoomId] = useState(null);

  // State Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (token) fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/courses`
      );
      setCourses(res.data);
    } catch (e) {
      console.error("Lỗi tải khóa học:", e);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? "/api/register" : "/api/login";
      const payload = isRegister
        ? { email, password, name, role: "STUDENT" }
        : { email, password };

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        payload
      );

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

  // --- ACTIONS ---

  const createCourse = async () => {
    const title = prompt("Nhập tên khóa học mới:");
    if (!title) return;
    const priceStr = prompt("Nhập giá tiền (VNĐ):", "0");
    const description = prompt("Mô tả ngắn:", "Khóa học...");

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/courses`,
        {
          title,
          description,
          price: parseFloat(priceStr) || 0,
          thumbnail: "https://via.placeholder.com/300",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Tạo khóa học thành công!");
      fetchCourses();
    } catch (e) {
      alert("❌ Lỗi: " + (e.response?.data?.error || "Không thể tạo khóa học"));
    }
  };

  // Mua khóa học (Enroll)
  const enrollCourse = async (courseId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/enroll`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Đăng ký thành công! Bạn có thể vào học ngay.");
      openCourseManager(courseId);
    } catch (e) {
      alert(e.response?.data?.error || "Lỗi đăng ký");
    }
  };

  // Mở trang quản lý/học tập
  const openCourseManager = (courseId) => {
    setActiveCourseId(courseId);
    setView("manager");
  };

  // Vào phòng Live (Từ trang CourseManager)
  const joinLiveClass = (courseId) => {
    setLiveRoomId(courseId);
    setView("live-room");
  };

  // --- RENDER ---

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

  if (view === "live-room") {
    return (
      <ClassRoom
        user={user}
        courseId={liveRoomId}
        onLeave={() => setView("manager")}
      />
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} onNavigate={setView}>
      {/* MÀN HÌNH DASHBOARD */}
      {view === "dashboard" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Khám phá khóa học
            </h2>
            {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
              <button
                onClick={createCourse}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2"
              >
                <span>+</span> Tạo khóa mới
              </button>
            )}
          </div>

          {/* COURSE LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100 flex flex-col"
              >
                <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
                  <span className="text-white font-bold text-3xl opacity-30">
                    COURSE
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      General
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {course.price === 0 ? "FREE" : `$${course.price}`}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                      {course.teacher?.name?.charAt(0) || "T"}
                    </div>
                    <span className="text-sm text-gray-500">
                      {course.teacher?.name || "Unknown"}
                    </span>
                  </div>

                  {/* Logic Nút Bấm */}
                  {user.role === "INSTRUCTOR" || user.role === "ADMIN" ? (
                    <button
                      onClick={() => openCourseManager(course.id)}
                      className="w-full bg-gray-800 text-white py-2 rounded font-bold"
                    >
                      ⚙️ Quản Lý
                    </button>
                  ) : (
                    <button
                      onClick={() => enrollCourse(course.id)}
                      className="w-full bg-blue-600 text-white py-2 rounded font-bold"
                    >
                      🚀 Đăng Ký / Vào Học
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MÀN HÌNH QUẢN LÝ / HỌC TẬP */}
      {view === "manager" && activeCourseId && (
        <CourseManager
          courseId={activeCourseId}
          user={user}
          token={token}
          onBack={() => setView("dashboard")}
          onJoinLive={joinLiveClass}
        />
      )}
    </Layout>
  );
}

export default App;
