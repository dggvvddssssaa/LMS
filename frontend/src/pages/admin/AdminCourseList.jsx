import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';
import { useToast } from '../../contexts/ToastContext';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { ConfirmDialog, ErrorState, LoadingState } from '../../components/ui';

export default function AdminCourseList() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { confirmState, openConfirm, closeConfirm, handleConfirm } = useConfirmDialog();

    useEffect(() => {
        httpClient.get('/admin/courses').then(res => {
            if (res.data.success) setCourses(res.data.data);
        }).catch((err) => {
            setError(err);
        }).finally(() => setLoading(false));
    }, []);

    const handleDelete = (id) => {
        openConfirm({
            title: 'Xóa khóa học',
            message: 'Bạn có chắc chắn muốn xóa khóa học này?',
            onConfirm: async () => {
                try {
                    await httpClient.delete(`/admin/courses/${id}`);
                    setCourses((prev) => prev.filter((c) => c.id !== id));
                    pushToast({ type: 'success', title: 'Đã xóa khóa học' });
                } catch (err) {
                    pushToast({ type: 'error', title: 'Không thể xóa khóa học', message: err.message });
                }
            },
        });
    };

    const handlePublish = async (id) => {
        try {
            await httpClient.put(`/admin/courses/${id}/publish`);
            setCourses((prev) => prev.map((c) => c.id === id ? { ...c, status: 'published', is_published: true } : c));
            pushToast({ type: 'success', title: 'Đã xuất bản khóa học' });
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể xuất bản', message: err.message });
        }
    };

    const handleCreate = async () => {
        try {
            const res = await httpClient.post('/admin/courses', { title: 'Khóa học mới' });
            const courseId = res.data?.data?.id;
            
            if (!res.data?.success || !courseId) {
                pushToast({ type: 'error', title: 'Lỗi tạo khóa học', message: res.data?.message || 'API không trả về ID khóa học' });
                return;
            }
            
            navigate(`/admin/courses/${courseId}/editor`);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Không thể tạo khóa học';
            pushToast({ type: 'error', title: 'Không thể tạo khóa học', message: msg });
        }
    };

    if (loading) return <LoadingState label="Đang tải..." fullHeight />;
    if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;

    return (
        <div className="-mx-4 lg:-mx-8 -my-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white py-10 px-4 relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
                <div className="container mx-auto max-w-7xl relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Quản lý khóa học</h1>
                        <p className="text-blue-100 opacity-90">{courses.length} khóa học trên hệ thống</p>
                    </div>
                    <button onClick={handleCreate} className="px-6 py-3 bg-white text-blue-900 rounded-full font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        + Tạo khóa học mới
                    </button>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 pb-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="text-4xl font-black text-blue-600 mb-1">{courses.length}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tổng khóa học</div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="text-4xl font-black text-green-600 mb-1">{courses.filter(c => c.status === 'published').length}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Đã xuất bản</div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="text-4xl font-black text-amber-500 mb-1">{courses.filter(c => c.status === 'draft').length}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Bản nháp</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="relative h-44 bg-slate-100 overflow-hidden">
                            {course.thumbnail ? (
                                <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                    <span className="text-5xl">{course.type === 'live' ? '🔴' : '📹'}</span>
                                </div>
                            )}
                            <div className="absolute top-3 right-3 flex gap-1.5">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${course.status === 'published' ? 'bg-green-500 text-white shadow-md' : 'bg-amber-400 text-white shadow-md'}`}>{course.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}</span>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${course.type === 'live' ? 'bg-red-500 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'}`}>{course.type === 'live' ? 'Live' : 'Video'}</span>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight min-h-[48px]">{course.title}</h3>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{course.description || 'Chưa có mô tả'}</p>
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 font-medium">
                                <span>{course._count?.enrollments || 0} học viên</span>
                                <span className="font-black text-blue-600 text-sm">{parseFloat(course.price) > 0 ? `${parseFloat(course.price).toLocaleString()} đ` : 'Miễn phí'}</span>
                            </div>
                            <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
                                <Link to={`/admin/courses/${course.id}/editor`} className="flex-1 text-center px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                                    ✏️ Sửa
                                </Link>
                                {course.status !== 'published' && (
                                    <button onClick={() => handlePublish(course.id)} className="px-3 py-2.5 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors" title="Xuất bản">
                                        🚀
                                    </button>
                                )}
                                <button onClick={() => handleDelete(course.id)} className="px-3 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors" title="Xóa">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onCancel={closeConfirm}
                onConfirm={handleConfirm}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                variant={confirmState.variant}
            />
            </div>
        </div>
    );
}

