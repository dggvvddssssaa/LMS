import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { courseService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog, ErrorState, LoadingState } from '../../components/ui';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const CourseManagement = () => {
    const { user } = useAuthStore();
    const { pushToast } = useToast();
    const { confirmState, openConfirm, closeConfirm, handleConfirm } = useConfirmDialog();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editCourseData, setEditCourseData] = useState(null);
    const [newCourseData, setNewCourseData] = useState({ title: '', description: '', thumbnail: '', type: 'live', price: 0 });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await courseService.getCourses();
            if (res.success) {
                setCourses(res.data);
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchCourses();
        }
    }, [user, fetchCourses]);

    const togglePublish = useCallback(async (courseId, currentStatus) => {
        try {
            const res = await courseService.updateCourse(courseId, { is_published: !currentStatus });
            if (res.success) {
                pushToast({ type: 'success', title: !currentStatus ? 'Đã hiển thị khóa học' : 'Đã ẩn khóa học' });
                fetchCourses();
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể cập nhật trạng thái', message: err.message });
        }
    }, [fetchCourses, pushToast]);

    const handleAddCourse = async (e) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            const payload = { ...newCourseData, is_published: true };
            if (newCourseData.type === 'live') {
                payload.live_class_data = { schedule_config: {}, total_sessions: 0, max_students: 50 };
            }
            const res = await courseService.createCourse(payload);
            if (res.success) {
                pushToast({ type: 'success', title: 'Tạo khóa học thành công' });
                setShowAddModal(false);
                setNewCourseData({ title: '', description: '', thumbnail: '', type: 'live', price: 0 });
                fetchCourses();
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể tạo khóa học', message: err.message });
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEditCourse = async (e) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            const res = await courseService.updateCourse(editCourseData.id, {
                title: editCourseData.title,
                description: editCourseData.description,
                thumbnail: editCourseData.thumbnail,
                type: editCourseData.type,
                price: editCourseData.price,
            });
            if (res.success) {
                pushToast({ type: 'success', title: 'Cập nhật khóa học thành công' });
                setShowEditModal(false);
                setEditCourseData(null);
                fetchCourses();
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể cập nhật khóa học', message: err.message });
        } finally {
            setSubmitLoading(false);
        }
    };

    const openEditModal = useCallback((course) => {
        setEditCourseData({
            id: course.id,
            title: course.title,
            description: course.description || '',
            thumbnail: course.thumbnail || '',
            type: course.type || 'video',
            price: course.price || 0,
        });
        setShowEditModal(true);
    }, []);

    const handleDeleteCourse = useCallback((id) => {
        openConfirm({
            title: 'Xóa khóa học',
            message: 'Bạn có chắc chắn muốn xóa khóa học này?',
            onConfirm: async () => {
                try {
                    const res = await courseService.deleteCourse(id);
                    if (res.success) {
                        pushToast({ type: 'success', title: 'Xóa khóa học thành công' });
                        fetchCourses();
                    }
                } catch (err) {
                    pushToast({ type: 'error', title: 'Không thể xóa khóa học', message: err.message });
                }
            },
        });
    }, [fetchCourses, openConfirm, pushToast]);

    if (loading) return <LoadingState label="Đang tải danh sách khóa học..." fullHeight />;
    if (error) return <ErrorState message={error.message} onRetry={fetchCourses} />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Cổng Khóa Học</h1>
                    <p className="text-slate-500 mt-1">Duyệt và xem thông tin chi tiết khóa học mới.</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition">
                    + Thêm Khóa Học
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 pb-20">
                <div className="overflow-visible">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                <th className="p-4 font-bold">Khóa Học</th>
                                <th className="p-4 font-bold">Giảng Viên</th>
                                <th className="p-4 font-bold">Loại</th>
                                <th className="p-4 font-bold">Giá</th>
                                <th className="p-4 font-bold text-center">Trạng Thái</th>
                                <th className="p-4 font-bold text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-50">
                            {courses.map((c) => (
                                <CourseRow key={c.id} course={c} onTogglePublish={togglePublish} onDeleteCourse={handleDeleteCourse} onEditCourse={openEditModal} />
                            ))}
                        </tbody>
                    </table>
                    {courses.length === 0 && <div className="p-12 text-center text-slate-500">Chưa có khóa học nào trên hệ thống</div>}
                </div>
            </div>

            {showAddModal && (
                <ModalCourseForm title="Thêm Khóa Học Mới" data={newCourseData} setData={setNewCourseData} submitLoading={submitLoading} onClose={() => setShowAddModal(false)} onSubmit={handleAddCourse} submitText="Tạo Khóa Học" />
            )}

            {showEditModal && editCourseData && (
                <ModalCourseForm title="Chỉnh Sửa Khóa Học" data={editCourseData} setData={setEditCourseData} submitLoading={submitLoading} onClose={() => { setShowEditModal(false); setEditCourseData(null); }} onSubmit={handleEditCourse} submitText="Lưu Thay Đổi" />
            )}

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
};

const ModalCourseForm = ({ title, data, setData, submitLoading, onClose, onSubmit, submitText }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên Khóa Học</label>
                    <input type="text" required value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô Tả</label>
                    <textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500" rows="2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thể Loại</label>
                        <select value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500">
                            <option value="live">Trực Tuyến (Live)</option>
                            <option value="video">Video</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giá (VNĐ)</label>
                        <input type="number" required min="0" value={data.price} onChange={(e) => setData({ ...data, price: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL Thumbnail</label>
                    <input type="text" value={data.thumbnail} onChange={(e) => setData({ ...data, thumbnail: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500" />
                </div>
                <div className="pt-4 flex space-x-3">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy</button>
                    <button type="submit" disabled={submitLoading} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50">
                        {submitLoading ? 'Đang xử lý...' : submitText}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

const CourseRow = memo(({ course, onTogglePublish, onDeleteCourse, onEditCourse }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return undefined;
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const runAndCloseMenu = (action) => {
        action();
        setMenuOpen(false);
    };

    return (
        <tr className="hover:bg-slate-50/80 transition-colors">
            <td className="p-4">
                <div className="flex items-center space-x-3">
                    {course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="w-12 h-12 rounded object-cover border border-slate-200" /> : <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center border border-slate-200"><span className="text-slate-400 text-xs font-bold">IMG</span></div>}
                    <div>
                        <div className="font-bold text-slate-800">{course.title}</div>
                        <div className="text-xs text-slate-500 truncate w-48">{course.description || 'Chưa cập nhật mô tả...'}</div>
                    </div>
                </div>
            </td>
            <td className="p-4 font-semibold text-slate-700">{course.instructor_name || 'Chưa rõ'}</td>
            <td className="p-4"><span className="px-2.5 py-1 rounded text-xs font-bold inline-block border bg-slate-50 text-slate-700 border-slate-200">{course.type === 'live' ? 'Trực Tuyến (Live)' : 'Video'}</span></td>
            <td className="p-4 font-mono font-bold text-slate-700">{parseFloat(course.price) > 0 ? `${parseFloat(course.price).toLocaleString()}đ` : <span className="text-green-600">Miễn phí</span>}</td>
            <td className="p-4 text-center">{course.is_published ? <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" title="Đã xuất bản"></span> : <span className="w-2.5 h-2.5 bg-slate-300 rounded-full inline-block" title="Bản nháp"></span>}</td>
            <td className="p-4 text-right">
                <div className="relative inline-block text-left" ref={menuRef}>
                    <button type="button" onClick={() => setMenuOpen((prev) => !prev)} className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors" aria-haspopup="true" aria-expanded={menuOpen}>
                        <span className="text-lg leading-none">⋮</span>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl z-50 py-1">
                            <Link to={`/admin/courses/${course.id}/editor`} onClick={() => setMenuOpen(false)} className="block w-full px-4 py-2 text-left text-sm text-indigo-700 hover:bg-indigo-50 transition-colors">Quản lý nội dung</Link>
                            <button type="button" onClick={() => runAndCloseMenu(() => onEditCourse(course))} className="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 transition-colors">Sửa</button>
                            <button type="button" onClick={() => runAndCloseMenu(() => onTogglePublish(course.id, course.is_published))} className="w-full px-4 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 transition-colors">{course.is_published ? 'Ẩn khóa học' : 'Duyệt khóa học'}</button>
                            <button type="button" onClick={() => runAndCloseMenu(() => onDeleteCourse(course.id))} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">Xóa</button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
});

export default CourseManagement;

