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
  <div className="bg-slate-900 min-h-[calc(100vh-64px)] -mt-8 flex flex-col justify-center relative overflow-hidden">
    {/* Decorative background elements */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 left-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
    
    <div className="container mx-auto px-4 lg:px-8 py-20 relative z-10 flex flex-col lg:flex-row items-center gap-12">
      <div className="w-full lg:w-1/2 text-center lg:text-left">
        <div className="inline-block px-4 py-2 bg-blue-900/50 border border-blue-500/30 rounded-full text-blue-300 font-mono text-sm mb-6 shadow-sm">
          <span className="text-green-400">const</span> <span className="text-blue-300">platform</span> = <span className="text-yellow-300">'LMSEdu'</span>;
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 text-white tracking-tight leading-tight">
          Làm chủ kỹ năng <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
            Lập Trình
          </span>
        </h1>
        <p className="text-slate-400 text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
          Nền tảng giáo dục trực tuyến chuyên biệt dành cho Developer. Trải nghiệm học tập tương tác với phòng học trực tuyến, thực hành code trực tiếp và hệ thống bài tập đa dạng.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <Link
            to="/courses"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            Bắt đầu học ngay
          </Link>
          <Link
            to="/register"
            className="bg-slate-800 border border-slate-700 text-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            Đăng ký tài khoản
          </Link>
        </div>
        
        <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 text-slate-500">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">50+</span>
            <span className="text-sm">Khóa học</span>
          </div>
          <div className="w-px h-10 bg-slate-700"></div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">10k+</span>
            <span className="text-sm">Học viên</span>
          </div>
          <div className="w-px h-10 bg-slate-700"></div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">4.9/5</span>
            <span className="text-sm">Đánh giá</span>
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-[#1e1e1e]">
          <div className="flex items-center px-4 py-3 bg-[#2d2d2d] border-b border-slate-700">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="mx-auto text-xs text-slate-400 font-mono">App.jsx — LMSEdu</div>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto text-slate-300">
            <pre>
              <code className="language-javascript">
<span className="text-pink-500">import</span> React <span className="text-pink-500">from</span> <span className="text-green-400">'react'</span>;<br/>
<span className="text-pink-500">import</span> &#123; <span className="text-blue-300">CodeBlock</span>, <span className="text-blue-300">LiveClass</span> &#125; <span className="text-pink-500">from</span> <span className="text-green-400">'lmsedu-ui'</span>;<br/>
<br/>
<span className="text-pink-500">const</span> <span className="text-blue-400">DeveloperJourney</span> = () =&gt; &#123;<br/>
&nbsp;&nbsp;<span className="text-pink-500">const</span> [skills, setSkills] = <span className="text-yellow-200">useState</span>([]);<br/>
<br/>
&nbsp;&nbsp;<span className="text-pink-500">const</span> <span className="text-blue-400">startLearning</span> = <span className="text-pink-500">async</span> () =&gt; &#123;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-500">await</span> <span className="text-yellow-200">joinLiveClass</span>(&#123; topic: <span className="text-green-400">'WebRTC'</span> &#125;);<br/>
&nbsp;&nbsp;&nbsp;&nbsp;setSkills(prev =&gt; [...prev, <span className="text-green-400">'Fullstack Mastery'</span>]);<br/>
&nbsp;&nbsp;&#125;;<br/>
<br/>
&nbsp;&nbsp;<span className="text-pink-500">return</span> (<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-blue-400">div</span> <span className="text-yellow-200">className</span>=<span className="text-green-400">"success"</span>&gt;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-blue-400">h1</span>&gt;Welcome to Future&lt;/<span className="text-blue-400">h1</span>&gt;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-blue-400">button</span> <span className="text-yellow-200">onClick</span>=&#123;startLearning&#125;&gt;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Execute<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-blue-400">button</span>&gt;<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-blue-400">div</span>&gt;<br/>
&nbsp;&nbsp;);<br/>
&#125;;
              </code>
            </pre>
          </div>
        </div>
      </div>
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

        {/* Course Management for Admins and Instructors */}
        <Route element={<AuthRequired roles={['admin', 'instructor']} />}>
          <Route path="admin/courses" element={<AdminCourseList />} />
          <Route path="admin/courses-editor" element={<Navigate to="/admin/courses" replace />} />
          <Route path="admin/courses/:id/editor" element={<CourseEditor />} />
          <Route path="admin/courses-editor/:id" element={<CourseEditor />} />
        </Route>

        {/* Protected â€” admin only */}
        <Route element={<AuthRequired roles={['admin']} />}>
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="admin/live-monitor" element={<AdminLiveMonitor />} />
          <Route path="admin/certificate-templates" element={<AdminCertificateTemplates />} />
          <Route path="admin/certificate-templates/:id/editor" element={<AdminCertificateTemplateEditor />} />
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
