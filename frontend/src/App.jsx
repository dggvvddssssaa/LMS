import React, { Suspense, lazy } from "react";
import { Routes, Route, Link, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";

import CourseList from "./pages/course/CourseList";
import CourseDetail from "./pages/course/CourseDetail";
import TeacherCourseDetail from "./pages/teacher/TeacherCourseDetail";
import SessionCreate from "./pages/session/SessionCreate";
import CertificateView from "./pages/course/CertificateView";

// Admin imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdminLiveMonitor from "./pages/admin/AdminLiveMonitor";
import AdminCourseList from "./pages/admin/AdminCourseList";
import AdminCertificateTemplates from "./pages/admin/AdminCertificateTemplates";

// Lazy Loaded Routes
const Classroom = lazy(() => import("./components/Classroom"));
const LessonLearning = lazy(() => import("./pages/course/LessonLearning"));
const CourseEditor = lazy(() => import("./pages/admin/CourseEditor"));
const AdminCertificateTemplateEditor = lazy(() => import("./pages/admin/AdminCertificateTemplateEditor"));

const Landing = () => (
  <div className="p-20 text-center bg-white min-h-[60vh] flex flex-col justify-center items-center rounded-2xl shadow-sm border border-slate-100 mt-8 mx-4 lg:mx-auto max-w-5xl">
    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-slate-800 tracking-tight">
      Chào Mừng Đến Với <span className="text-blue-600">LMSEdu</span>
    </h1>
    <p className="text-slate-500 text-xl max-w-3xl mx-auto leading-relaxed mb-8">
      Nền tảng giáo dục trực tuyến tiên tiến tích hợp phòng học tương tác chất
      lượng cao và các công cụ hỗ trợ giảng viên toàn diện. Học tập mọi lúc mọi
      nơi với cộng đồng học viên năng động.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link
        to="/courses"
        className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
      >
        Khám Phá Khóa Học
      </Link>
      <Link
        to="/register"
        className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all"
      >
        Tham Gia Ngay
      </Link>
    </div>
  </div>
);

/** Wrapper that requires auth for nested routes */
const AuthRequired = ({ roles }) => (
  <ProtectedRoute roles={roles}>
    <Outlet />
  </ProtectedRoute>
);

function App() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="courses" element={<CourseList />} />
        <Route path="course/:id" element={<CourseDetail />} />

        {/* Protected â€” any authenticated user */}
        <Route element={<AuthRequired />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="session/create" element={<SessionCreate />} />
        </Route>

        {/* Protected â€” instructor only */}
        <Route element={<AuthRequired roles={['instructor', 'admin']} />}>
          <Route path="teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="teacher/course/:id" element={<TeacherCourseDetail />} />
        </Route>

        {/* Protected â€” admin only */}
        <Route element={<AuthRequired roles={['admin']} />}>
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="admin/live-monitor" element={<AdminLiveMonitor />} />
          <Route path="admin/courses" element={<AdminCourseList />} />
          <Route path="admin/certificate-templates" element={<AdminCertificateTemplates />} />
          <Route path="admin/certificate-templates/:id/editor" element={<AdminCertificateTemplateEditor />} />
          <Route path="admin/courses-editor" element={<Navigate to="/admin/courses" replace />} />
          <Route path="admin/courses/:id/editor" element={<CourseEditor />} />
          <Route path="admin/courses-editor/:id" element={<CourseEditor />} />
        </Route>
      </Route>

      {/* Fullscreen Routes â€” authenticated */}
      <Route path="/session/:id/join" element={<ProtectedRoute><Classroom /></ProtectedRoute>} />
      <Route path="/course/:id/learn" element={<ProtectedRoute><LessonLearning /></ProtectedRoute>} />
      <Route path="/certificate/:id" element={<ProtectedRoute><CertificateView /></ProtectedRoute>} />
    </Routes>
    </Suspense>
  );
}

export default App;
