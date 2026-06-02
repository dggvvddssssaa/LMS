import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useAsyncData from '../../hooks/useAsyncData';
import { courseService, sessionService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import httpClient from '../../services/core/httpClient';

const STATUS_MAP = {
    scheduled: { label: 'Sắp diễn ra', color: 'bg-amber-100 text-amber-700' },
    open: { label: 'Đã mở phòng', color: 'bg-blue-100 text-blue-700' },
    ongoing: { label: 'Đang diễn ra', color: 'bg-green-100 text-green-700' },
    ended: { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-500' },
};

const TeacherDashboard = () => {
    const { user } = useAuthStore();
    const { pushToast } = useToast();
    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState('video');

    const { data, loading, error, retry, setData } = useAsyncData(async () => {
        const [courseRes, teachingRes] = await Promise.all([
            courseService.getCourses(),
            sessionService.getMyTeaching().catch(() => ({ data: [] })),
        ]);
        return {
            courses: courseRes?.data || [],
            teachingSessions: teachingRes?.data || [],
        };
    }, [user?.id]);

    const courses = useMemo(() => {
        const list = data?.courses || [];
        if (user?.role === 'admin') return list;
        return list.filter((course) => course.instructor_id === user?.id);
    }, [data, user?.id, user?.role]);

    const teachingSessions = data?.teachingSessions || [];

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: newTitle,
                description: 'Khóa học mới tạo',
                thumbnail: '',
                type: newType,
                price: 0,
                is_published: false,
            };

            if (newType === 'live' || newType === 'hybrid') {
                payload.live_class_data = {
                    schedule_config: {},
                    total_sessions: 0,
                    max_students: 50,
                };
            }

            const res = await courseService.createCourse(payload);
            if (res.success) {
                setData((prev) => ({ ...prev, courses: [res.data, ...(prev?.courses || [])] }));
                setNewTitle('');
                pushToast({ type: 'success', title: 'Tạo khóa học thành công' });
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể tạo khóa học', message: err.message });
        }
    };

    const handleOpenSession = async (sessionId) => {
        try {
            const res = await httpClient.put(`/sessions/${sessionId}/open`);
            if (res.data.success) {
                if (res.data.data.status === 'open' && !res.data.data.meeting_id) {
                    pushToast({ type: 'error', title: 'Lỗi cấu hình', message: 'Không tìm thấy thông tin phòng họp (meeting_id).' });
                    return;
                }
                setData(prev => ({
                    ...prev,
                    teachingSessions: (prev?.teachingSessions || []).map(s =>
                        s.id === sessionId ? { ...s, ...res.data.data } : s
                    )
                }));
                pushToast({ type: 'success', title: '🟢 Đã mở lớp', message: 'Lớp học đã được xuất bản và sẵn sàng.' });
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Không thể mở lớp' });
        }
    };

    if (loading) return <LoadingState label="Đang tải dữ liệu..." fullHeight />;
    if (error) return <ErrorState message={error.message} onRetry={retry} />;

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Khu Vực Giảng Viên</h1>
                    <p className="text-slate-500 mt-2">Quản lý lớp học Live và biên soạn khóa học Video.</p>
                </div>
                <Link to="/admin/courses" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md whitespace-nowrap">
                    ⚙️ Quản Lý Khóa Học Nâng Cao
                </Link>
            </div>

            {/* My Teaching Sessions */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 mb-8 shadow-sm">
                <h2 className="text-lg font-bold mb-4 text-purple-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
                    Lớp Tôi Dạy
                </h2>
                {teachingSessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 bg-white/60 rounded-xl border border-dashed border-purple-200">
                        Chưa có lớp online nào được gán cho bạn.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teachingSessions.map(session => {
                            const statusInfo = STATUS_MAP[session.status] || STATUS_MAP.scheduled;
                            return (
                                <div key={session.id} className="bg-white rounded-2xl p-5 border border-purple-100 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{session.title}</h3>
                                    <p className="text-xs text-slate-500 mb-1">Khóa: {session.course_title}</p>
                                    <p className="text-xs text-slate-500 mb-4">
                                        🕐 {new Date(session.start_time).toLocaleString('vi-VN')}
                                    </p>
                                    <div className="flex gap-2">
                                        {session.status === 'scheduled' && (
                                            <button
                                                onClick={() => handleOpenSession(session.id)}
                                                className="flex-1 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition"
                                            >
                                                🟢 Mở lớp
                                            </button>
                                        )}
                                        {(session.status === 'open' || session.status === 'ongoing') && session.meeting_id && (
                                            <Link
                                                to={`/session/${session.meeting_id}/join`}
                                                className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition text-center"
                                            >
                                                🎥 Vào dạy
                                            </Link>
                                        )}
                                        {(session.status === 'open' || session.status === 'ongoing') && !session.meeting_id && (
                                            <span className="flex-1 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm text-center">
                                                ⚠️ Thiếu Meeting ID
                                            </span>
                                        )}
                                        {session.status === 'ended' && (
                                            <span className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm text-center">
                                                Đã kết thúc
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <h2 className="text-lg font-bold mb-4 text-slate-700">Khởi tạo nhanh khóa học mới</h2>
                <form onSubmit={handleCreateCourse} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Nhập tên khóa học..."
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-slate-50 focus:bg-white"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        required
                    />
                    <select
                        className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-slate-50 focus:bg-white text-slate-700 font-medium"
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                    >
                        <option value="video">Khóa Học Video</option>
                        <option value="live">Lớp Học Trực Tuyến (Live)</option>
                        <option value="hybrid">Hỗn hợp (Video + Live)</option>
                    </select>
                    <button type="submit" className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20 active:scale-95 whitespace-nowrap">
                        + Bắt Đầu Tạo
                    </button>
                </form>
            </div>

            {courses.length === 0 ? (
                <EmptyState title="Bạn chưa có khóa học nào" description="Tạo một khóa học mới để bắt đầu chia sẻ kiến thức." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all hover:-translate-y-1 group relative overflow-hidden">
                            {!course.is_published && (
                                <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-2 py-1 rounded">
                                    Bản Nháp
                                </div>
                            )}
                            <div className="h-32 bg-slate-100 border-b border-slate-100 flex items-center justify-center">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} className="w-full h-full object-cover" alt="Course Thumbnail" />
                                ) : (
                                    <span className="text-6xl opacity-30">{course.type === 'live' ? '🎙️' : course.type === 'hybrid' ? '🎛️' : '🎥'}</span>
                                )}
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-primary transition-colors line-clamp-2 min-h-[56px]">{course.title}</h3>
                                <div className="text-xs font-bold text-slate-500 mb-4 tracking-wider flex items-center gap-1">
                                    {course.type === 'live' ? (
                                        <><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Lớp Live</>
                                    ) : course.type === 'hybrid' ? (
                                        <><span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span> Hỗn hợp</>
                                    ) : (
                                        <><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Khóa Video</>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-auto">
                                    <Link to={`/teacher/course/${course.id}`} className="flex-1 min-w-[120px] bg-slate-100 text-slate-700 text-center py-2.5 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-bold">
                                        Nội dung
                                    </Link>
                                    <Link to={`/admin/courses/${course.id}/editor`} className="flex-1 min-w-[120px] bg-blue-50 text-blue-600 hover:bg-blue-100 text-center py-2.5 rounded-xl transition-colors shadow-sm text-sm font-bold">
                                        Cài đặt
                                    </Link>
                                    {(course.type === 'live' || course.type === 'hybrid') && (
                                        <Link to={`/session/create?courseId=${course.id}`} className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 text-center py-2.5 rounded-xl transition-colors shadow-sm text-sm font-bold">
                                            Lịch Dạy Live
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
