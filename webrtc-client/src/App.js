import React, { useState, useEffect } from "react";
import axios from "axios";
import ClassRoom from "./ClassRoom";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);

  // State Form Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  // Load danh sách khóa học khi có token
  useEffect(() => {
    if (token) {
      fetchCourses();
    }
    // eslint-disable-next-line
  }, [token]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/courses");
      setCourses(res.data);
    } catch (e) {
      console.error("Failed to fetch courses");
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = isRegister ? "/api/register" : "/api/login";
      const payload = isRegister
        ? { email, password, name, role: "STUDENT" }
        : { email, password }; // Mặc định role STUDENT, bạn có thể sửa API để chọn role

      const res = await axios.post(`http://localhost:3001${endpoint}`, payload);

      if (!isRegister) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsRegister(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Có lỗi xảy ra");
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setActiveCourseId(null);
    setCourses([]);
  };

  const createCourse = async () => {
    const title = prompt("Nhập tên khóa học mới:");
    if (title) {
      try {
        await axios.post(
          "http://localhost:3001/api/courses",
          { title, description: "Mô tả khóa học" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchCourses();
      } catch (e) {
        alert("Lỗi: Chỉ Giáo viên mới được tạo khóa học!");
      }
    }
  };

  // --- RENDER ---

  // 1. MÀN HÌNH LỚP HỌC (VIDEO CALL)
  if (activeCourseId && user) {
    return (
      <ClassRoom
        user={user}
        courseId={activeCourseId}
        onLeave={() => setActiveCourseId(null)}
      />
    );
  }

  // 2. MÀN HÌNH LOGIN / REGISTER
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-500">
            {isRegister ? "Đăng Ký LMS" : "Đăng Nhập LMS"}
          </h2>
          {error && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <input
                className="w-full p-3 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Họ và Tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              className="w-full p-3 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full p-3 bg-gray-700 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition transform hover:scale-[1.02]">
              {isRegister ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
            <span
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-400 cursor-pointer hover:underline"
            >
              {isRegister ? "Đăng nhập ngay" : "Đăng ký ngay"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // 3. MÀN HÌNH DASHBOARD (DANH SÁCH KHÓA HỌC)
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">
          Hệ Thống LMS
        </h1>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <p className="font-bold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500 uppercase">{user.role}</p>
          </div>
          {user.role === "TEACHER" && (
            <button
              onClick={createCourse}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
            >
              + Tạo Khóa Học
            </button>
          )}
          <button
            onClick={logout}
            className="text-red-500 font-bold hover:text-red-700 transition"
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 border-l-4 border-blue-500 pl-4">
          Các khóa học đang diễn ra
        </h2>

        {courses.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            Chưa có khóa học nào.{" "}
            {user.role === "TEACHER"
              ? "Hãy tạo khóa học mới!"
              : "Vui lòng chờ giáo viên tạo lớp."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
              >
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-4xl text-white opacity-30 font-bold">
                    COURSE
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium mb-4 flex items-center gap-1">
                    👨‍🏫 Giáo viên: {course.teacher?.name || "Unknown"}
                  </p>
                  <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-3">
                    {course.description ||
                      "Mô tả khóa học sẽ hiển thị ở đây. Tham gia ngay để bắt đầu học tập cùng mọi người."}
                  </p>
                  <button
                    onClick={() => setActiveCourseId(course.id)}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    🚀 Vào Lớp Học
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
