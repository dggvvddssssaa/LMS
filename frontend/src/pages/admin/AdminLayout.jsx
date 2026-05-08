import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const menuItems = [
    { path: '/admin/dashboard', label: 'Tổng quan', icon: '📊' },
    { path: '/admin/courses', label: 'Khóa học', icon: '📚' },
    { path: '/admin/users', label: 'Người dùng', icon: '👥' },
    { path: '/admin/live-monitor', label: 'Giám sát trực tuyến', icon: '🔴' },
];

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0`}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    {!collapsed && <h1 className="text-xl font-bold text-indigo-600">Quản trị LMS</h1>}
                    <button 
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                        {collapsed ? '→' : '←'}
                    </button>
                </div>

                <nav className="flex-1 py-4 space-y-1 px-2">
                    {menuItems.map(item => {
                        const active = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    active
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <span>🏠</span>
                        {!collapsed && <span>Về trang chính</span>}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
