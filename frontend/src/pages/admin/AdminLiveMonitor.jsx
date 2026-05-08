import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { liveClassService } from '../../services';

const AdminLiveMonitor = () => {
    const { user } = useAuthStore();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActiveSessions = async () => {
        try {
            setLoading(true);
            const data = await liveClassService.getMonitor();
            if (data) {
                setSessions(data);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách lớp học:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchActiveSessions();
        }
    }, [user]);

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải danh sách lớp Live...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    Giám Sát Lớp Học Live
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </h1>
                <p className="text-slate-500 mt-1">Theo dõi và "Dự giờ" các lớp học trực tuyến đang diễn ra trên hệ thống.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="text-4xl mb-4 text-slate-300">🎓</div>
                        <h3 className="text-lg font-bold text-slate-700">Hiện không có lớp Live nào đang diễn ra!</h3>
                        <p className="text-slate-500 mt-2">Tính năng này sẽ tự động cập nhật khi Giảng viên khai giảng khóa mới.</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-red-300 hover:shadow-md transition-all flex flex-col h-full border-t-4 border-t-red-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Đang diễn ra</span>
                                    <p className="text-xs text-slate-400 mt-2">Bắt đầu: {new Date(session.start_time).toLocaleString('vi-VN')}</p>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{session.title}</h3>
                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">Khóa học: <span className="font-semibold text-slate-700">{session.course_title}</span></p>
                            
                            <div className="mt-auto pt-4 border-t border-slate-100 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                                        {session.instructor_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">{session.instructor_name}</p>
                                        <p className="text-xs text-slate-500">{session.instructor_email}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <Link 
                                to={`/session/${session.meeting_id || session.id}/join`} 
                                className="w-full block text-center py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                            >
                                Dự giờ & Kiểm tra
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminLiveMonitor;
