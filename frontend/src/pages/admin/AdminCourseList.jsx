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
            if (res.data.success) {
                navigate(`/admin/courses/${res.data.data.id}/editor`);
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể tạo khóa học', message: err.message });
        }
    };

    if (loading) return <LoadingState label="Đang tải..." fullHeight />;
    if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý khóa học</h1>
                    <p className="text-gray-500 mt-1">{courses.length} khóa học</p>
                </div>
                <button onClick={handleCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm">
                    + Tạo khóa học mới
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="text-3xl font-bold text-indigo-600">{courses.length}</div>
                    <div className="text-sm text-gray-500 mt-1">Tổng khóa học</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="text-3xl font-bold text-green-600">{courses.filter(c => c.status === 'published').length}</div>
                    <div className="text-sm text-gray-500 mt-1">Đã xuất bản</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="text-3xl font-bold text-amber-600">{courses.filter(c => c.status === 'draft').length}</div>
                    <div className="text-sm text-gray-500 mt-1">Bản nháp</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
                        <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-blue-50">
                            {course.thumbnail && <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />}
                            <div className="absolute top-3 right-3 flex gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{course.status === 'published' ? 'Published' : 'Draft'}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${course.type === 'live' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{course.type === 'live' ? 'Live' : 'Video'}</span>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{course.title}</h3>
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description || 'Chưa có mô tả'}</p>
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                <span>{course._count?.enrollments || 0} học viên</span>
                                <span className="font-bold text-indigo-600">{parseFloat(course.price) > 0 ? `${parseFloat(course.price).toLocaleString()}đ` : 'Miễn phí'}</span>
                            </div>
                            <div className="flex gap-2">
                                <Link to={`/admin/courses/${course.id}/editor`} className="flex-1 text-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition">
                                    ✏️ Chỉnh sửa
                                </Link>
                                {course.status !== 'published' && (
                                    <button onClick={() => handlePublish(course.id)} className="px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition">
                                        🚀
                                    </button>
                                )}
                                <button onClick={() => handleDelete(course.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition">
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
    );
}

