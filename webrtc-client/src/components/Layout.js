import React from "react";

const Layout = ({ children, user, onLogout, onNavigate }) => {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <h1 className="text-2xl font-bold text-blue-500 tracking-wider">
            LMS PRO
          </h1>
        </div>

        <nav className="flex-1 py-6">
          <ul className="space-y-2 px-4">
            <li>
              <button
                onClick={() => onNavigate("dashboard")}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center gap-3"
              >
                <span>🏠</span> Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("my-courses")}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center gap-3"
              >
                <span>📚</span> My Courses
              </button>
            </li>
            <li>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center gap-3 text-gray-400 cursor-not-allowed">
                <span>⚙️</span> Settings
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded text-sm font-bold transition"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Mobile (Ẩn trên Desktop) */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 md:hidden">
          <span className="font-bold">LMS Dashboard</span>
          <button className="text-gray-600">☰</button>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
