import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import httpClient from '../../services/core/httpClient';

const STATUS_MAP = {
  scheduled: { label: 'Sắp diễn ra', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  open: { label: 'Đã mở phòng', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  ongoing: { label: 'Đang diễn ra', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  ended: { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-500', border: 'border-slate-200' },
};

const AdminLiveMonitor = () => {
    const { user } = useAuthStore();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, today, ongoing, open
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await httpClient.get('/sessions/active');
            if (res.data?.success) {
                setSessions(Array.isArray(res.data.data) ? res.data.data : []);
            } else {
                setError(res.data?.message || 'Không thể tải danh sách');
            }
        } catch (error) {
            console.error('Lỗi tải danh sách lớp học:', error);
            setError('Có lỗi xảy ra khi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchSessions();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchSessions, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const filteredSessions = useMemo(() => {
        let list = sessions;

        if (filter === 'ongoing') {
            list = list.filter(s => s.status === 'ongoing' || s.status === 'open');
        } else if (filter === 'open') {
            list = list.filter(s => s.status === 'open');
        } else if (filter === 'scheduled') {
            list = list.filter(s => s.status === 'scheduled');
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s =>
                s.title?.toLowerCase().includes(q) ||
                s.course_title?.toLowerCase().includes(q) ||
                s.teacher_name?.toLowerCase().includes(q) ||
                s.instructor_name?.toLowerCase().includes(q)
            );
        }

        return list;
    }, [sessions, filter, searchQuery]);

    const counts = useMemo(() => ({
        all: sessions.length,
        ongoing: sessions.filter(s => s.status === 'ongoing' || s.status === 'open').length,
        open: sessions.filter(s => s.status === 'open').length,
        scheduled: sessions.filter(s => s.status === 'scheduled').length,
    }), [sessions]);

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải danh sách lớp Live...</div>;

    if (error) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="text-red-500 text-xl font-bold">Lỗi tải dữ liệu</div>
                <div className="text-slate-600">{error}</div>
                <button
                    onClick={fetchSessions}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="-mx-4 lg:-mx-8 -my-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white py-12 px-4 relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
                <div className="container mx-auto max-w-7xl relative z-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                        Giám Sát Lớp Học Live
                        <span className="flex h-4 w-4 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span>
                        </span>
                    </h1>
                    <p className="text-blue-100 opacity-90 max-w-2xl text-lg">Theo dõi và &ldquo;Dự giờ&rdquo; các lớp học trực tuyến đang diễn ra trên hệ thống.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl pb-12">
                {/* Filters */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { key: 'all', label: 'Tất cả', count: counts.all },
                            { key: 'ongoing', label: 'Đang diễn ra', count: counts.ongoing },
                            { key: 'open', label: 'Đã mở phòng', count: counts.open },
                            { key: 'scheduled', label: 'Sắp diễn ra', count: counts.scheduled },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    filter === f.key
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200'
                                }`}
                            >
                                {f.label} <span className="ml-1 opacity-70">({f.count})</span>
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo tên lớp, khóa học, giáo viên..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-80 bg-white"
                    />
                    <button onClick={fetchSessions} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition whitespace-nowrap">
                        🔄 Làm mới
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSessions.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                <span className="text-5xl">🔴</span>
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">
                                {filter !== 'all' ? 'Không có lớp nào phù hợp bộ lọc' : 'Hiện không có lớp Live nào'}
                            </h3>
                            <p className="text-slate-500">Tính năng này sẽ tự động cập nhật khi có lớp mới.</p>
                        </div>
                    ) : (
                        filteredSessions.map(session => {
                            const statusInfo = STATUS_MAP[session.status] || STATUS_MAP.scheduled;
                            const displayTeacher = session.teacher_name || session.instructor_name;

                            return (
                                <div key={session.id} className={`bg-white rounded-3xl p-6 shadow-sm border ${statusInfo.border} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group relative overflow-hidden`}>
                                    <div className={`absolute top-0 left-0 w-full h-1 ${
                                        session.status === 'ongoing' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                        session.status === 'open' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                        'bg-gradient-to-r from-amber-400 to-orange-400'
                                    }`} />
                                    <div className="flex justify-between items-start mb-5 pt-2">
                                        <div>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                            <p className="text-xs font-bold text-slate-400 mt-3">Bắt đầu: {new Date(session.start_time).toLocaleString('vi-VN')}</p>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[56px]">{session.title}</h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 font-medium">Khóa học: <span className="text-slate-700">{session.course_title}</span></p>

                                    <div className="mt-auto pt-4 border-t border-slate-50 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-base shadow-inner">
                                                {displayTeacher?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{displayTeacher || 'Chưa gán GV'}</p>
                                                <p className="text-xs text-slate-500 truncate">{session.teacher_email || session.instructor_email || ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/session/${session.meeting_id || session.id}/join`}
                                        className="w-full block text-center py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-colors shadow-sm group-hover:shadow-md"
                                    >
                                        Dự giờ & Kiểm tra
                                    </Link>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLiveMonitor;
