import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import NotificationBell from "./NotificationBell";

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userName = user?.name || "User";
  const userRole = user?.role || "";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-extrabold font-heading text-blue-600 flex items-center gap-2 tracking-tight hover:text-blue-700 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
              🎓
            </div>
            <span>LMSEdu</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link
              to="/courses"
              className="hover:text-blue-600 transition-colors py-2 relative group"
            >
              Khóa học
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="hover:text-blue-600 transition-colors py-2 font-bold relative group"
                >
                  Bảng điều khiển
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                {(userRole === "instructor" || userRole === "teacher") && (
                  <Link
                    to="/teacher/dashboard"
                    className="text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors font-bold"
                  >
                    Khu vực Giảng viên
                  </Link>
                )}
                {userRole === "admin" && (
                  <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl shadow-inner border border-slate-200">
                    <Link
                      to="/admin/dashboard"
                      className="text-slate-700 px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold"
                    >
                      Tổng quan
                    </Link>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <Link
                      to="/admin/users"
                      className="text-slate-700 px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold"
                    >Người dùng</Link>
                    <Link
                      to="/admin/courses"
                      className="text-slate-700 px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold"
                    >Khóa học</Link>
                    <Link
                      to="/admin/certificate-templates"
                      className="text-slate-700 px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg transition-all font-bold"
                    >Mẫu chứng chỉ</Link>
                    <Link
                      to="/admin/live-monitor"
                      className="text-red-600 bg-red-100/50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all font-bold flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>Giám sát trực tuyến</Link>
                  </div>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-5">
                <NotificationBell />
                <div className="hidden lg:block text-right border-l border-slate-200 pl-5">
                  <div className="text-sm font-bold text-slate-800">
                    {userName}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {userRole}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold text-lg">
                  {userInitial}
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-sm text-red-600 hover:text-red-700 font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition border border-transparent hover:border-red-100"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg shadow-blue-500/20"
                >
                  Tham gia ngay
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              <span className={`w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMobileMenu}
            ></div>
            
            {/* Drawer */}
            <div className="fixed top-16 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 md:hidden overflow-y-auto border-l border-slate-200 animate-slide-in-right">
              <nav className="p-4 space-y-1">
                <Link
                  to="/courses"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                >
                  <span className="text-lg">📚</span> Khóa học
                </Link>

                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                    >
                      <span className="text-lg">📊</span> Bảng điều khiển
                    </Link>

                    {(userRole === "instructor" || userRole === "teacher") && (
                      <Link
                        to="/teacher/dashboard"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl transition-colors"
                      >
                        <span className="text-lg">🎓</span> Khu vực Giảng viên
                      </Link>
                    )}

                    {userRole === "admin" && (
                      <>
                        <div className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Quản trị
                        </div>
                        <Link to="/admin/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                          <span className="text-lg">📈</span> Tổng quan
                        </Link>
                        <Link to="/admin/users" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                          <span className="text-lg">👥</span> Người dùng
                        </Link>
                        <Link to="/admin/courses" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                          <span className="text-lg">📦</span> Khóa học
                        </Link>
                        <Link to="/admin/certificate-templates" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                          <span className="text-lg">🎓</span> Mẫu chứng chỉ
                        </Link>
                        <Link to="/admin/live-monitor" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-xl transition-colors">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Giám sát trực tuyến
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-100 mt-4 pt-4">
                      <div className="px-4 py-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {userInitial}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{userName}</div>
                          <div className="text-xs text-slate-500 capitalize">{userRole}</div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full mt-2 text-sm text-red-600 hover:text-red-700 font-bold px-4 py-3 rounded-xl hover:bg-red-50 transition text-left flex items-center gap-3"
                      >
                        <span className="text-lg">🚪</span> Đăng xuất
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="border-t border-slate-100 mt-4 pt-4 space-y-2 px-2">
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="block text-center px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMobileMenu}
                      className="block text-center px-6 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md"
                    >
                      Tham gia ngay
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-extrabold font-heading text-blue-400 flex items-center gap-2 tracking-tight mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                  🎓
                </div>
                <span>LMSEdu</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Nền tảng học trực tuyến hiện đại, kết nối tri thức không giới
                hạn.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Khóa Học</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>
                  <Link
                    to="/courses"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Tất Cả Khóa Học
                  </Link>
                </li>
                <li>
                  <Link to="/courses?price=free" className="hover:text-blue-400 transition-colors">
                    Khóa Học Miễn Phí
                  </Link>
                </li>
                <li>
                  <Link to="/courses?price=premium" className="hover:text-blue-400 transition-colors">
                    Khóa Học Premium
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Hỗ Trợ</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>
                  <Link to="/courses" className="hover:text-blue-400 transition-colors">
                    Trung Tâm Hỗ Trợ
                  </Link>
                </li>
                <li>
                  <Link to="/courses" className="hover:text-blue-400 transition-colors">
                    Câu Hỏi Thường Gặp
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@lmsedu.vn" className="hover:text-blue-400 transition-colors">
                    Liên Hệ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Kết Nối</h3>
              <div className="flex space-x-4">
                <span
                  className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-default"
                >
                  <span className="text-sm">📘</span>
                </span>
                <span
                  className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-default"
                >
                  <span className="text-sm">🐦</span>
                </span>
                <a
                  href="mailto:support@lmsedu.vn"
                  className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  <span className="text-sm">📧</span>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center">
            <p className="text-sm font-medium text-slate-400 mb-2">
              © 2026 Hệ Thống Đào Tạo Trực Tuyến LMSEdu.
            </p>
            <p className="text-xs text-slate-500">
              Được xây dựng với ❤️ cho cộng đồng học tập.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
