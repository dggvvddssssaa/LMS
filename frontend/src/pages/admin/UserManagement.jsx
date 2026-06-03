import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { adminService, courseService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog, ErrorState, LoadingState } from '../../components/ui';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const UserManagement = () => {
    const { user } = useAuthStore();
    const { pushToast } = useToast();
    const { confirmState, openConfirm, closeConfirm, handleConfirm } = useConfirmDialog();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'student' });
    const [submitLoading, setSubmitLoading] = useState(false);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [showGiftModal, setShowGiftModal] = useState(false);
    const [giftUser, setGiftUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [giftLoading, setGiftLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await adminService.getUsers();
            if (res.success) {
                setUsers(res.data);
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await courseService.getPublishedCourses();
            if (res.success) {
                setCourses(res.data || []);
            } else {
                setCourses([]);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách khóa học:', err);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
            fetchCourses();
        }
    }, [user, fetchUsers, fetchCourses]);

    const handleVerifyInstructor = useCallback((id) => {
        openConfirm({
            title: 'Cấp quyền giảng viên',
            message: 'Xác nhận cấp quyền Giảng viên cho người dùng này?',
            variant: 'primary',
            onConfirm: async () => {
                try {
                    const res = await adminService.verifyInstructor(id);
                    if (res.success) {
                        pushToast({ type: 'success', title: 'Đã cấp quyền giảng viên' });
                        fetchUsers();
                    }
                } catch (err) {
                    pushToast({ type: 'error', title: 'Không thể cấp quyền', message: err.message });
                }
            },
        });
    }, [fetchUsers, openConfirm, pushToast]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            const res = await adminService.createUser(newUserData);
            if (res.success) {
                pushToast({ type: 'success', title: 'Khởi tạo người dùng thành công' });
                setShowAddModal(false);
                setNewUserData({ name: '', email: '', password: '', role: 'student' });
                fetchUsers();
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể tạo người dùng', message: err.message });
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteUser = useCallback((id) => {
        openConfirm({
            title: 'Xóa người dùng',
            message: 'Bạn có chắc chắn muốn xóa người dùng này?',
            onConfirm: async () => {
                try {
                    const res = await adminService.deleteUser(id);
                    if (res.success) {
                        pushToast({ type: 'success', title: 'Đã xóa người dùng' });
                        fetchUsers();
                    }
                } catch (err) {
                    pushToast({ type: 'error', title: 'Không thể xóa người dùng', message: err.message });
                }
            },
        });
    }, [fetchUsers, openConfirm, pushToast]);

    const handleViewDetails = useCallback(async (userId) => {
        setShowDetailsModal(true);
        setDetailsLoading(true);
        try {
            const res = await adminService.getUserDetails(userId);
            if (res.success) {
                setSelectedUser(res.data);
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể tải chi tiết người dùng', message: err.message });
            setShowDetailsModal(false);
        } finally {
            setDetailsLoading(false);
        }
    }, [pushToast]);

    const handleGiftCourse = async (e) => {
        e.preventDefault();
        if (selectedCourseIds.length === 0 || !giftUser) return;
        try {
            setGiftLoading(true);
            const res = await adminService.giftCourse(giftUser.id, selectedCourseIds);
            if (res.success) {
                pushToast({ type: 'success', title: 'Tặng khóa học thành công' });
                setShowGiftModal(false);
                setGiftUser(null);
                setSelectedCourseIds([]);
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể tặng khóa học', message: err.message });
        } finally {
            setGiftLoading(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toString().includes(q);
    });

    if (loading) return <LoadingState label="Đang tải danh sách người dùng..." fullHeight />;
    if (error) return <ErrorState message={error.message} onRetry={fetchUsers} />;

    return (
        <div className="-mx-4 lg:-mx-8 -my-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white py-12 px-4 relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
                <div className="container mx-auto max-w-7xl relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Quản Lý Người Dùng</h1>
                        <p className="text-blue-100 opacity-90 text-lg">Quản lý tài khoản và xét duyệt giảng viên.</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-5 py-3 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/10 text-white placeholder-blue-200 backdrop-blur-sm min-w-[250px]"
                        />
                        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap">
                            + Thêm Người Dùng
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 pb-12">

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 md:p-6 overflow-hidden">
                <div className="overflow-x-auto rounded-2xl border border-slate-50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                <th className="p-4 font-bold">ID</th>
                                <th className="p-4 font-bold">Họ Tên</th>
                                <th className="p-4 font-bold">Email</th>
                                <th className="p-4 font-bold">Vai Trò</th>
                                <th className="p-4 font-bold">Ngày ĐK</th>
                                <th className="p-4 font-bold text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-50">
                            {filteredUsers.map((u) => (
                                <UserRow key={u.id} user={u} onViewDetails={handleViewDetails} onVerifyInstructor={handleVerifyInstructor} onDeleteUser={handleDeleteUser} onGiftCourse={(user) => { setGiftUser(user); setShowGiftModal(true); }} />
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && <div className="p-8 text-center text-slate-500">Chưa có người dùng nào</div>}
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">Thêm Người Dùng Mới</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <input type="text" required value={newUserData.name} onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="Họ tên" />
                            <input type="email" required value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="Email" />
                            <input type="password" required value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="Mật khẩu" />
                            <select value={newUserData.role} onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                                <option value="student">Học Viên</option>
                                <option value="instructor">Giảng Viên</option>
                                <option value="admin">Quản Trị Viên</option>
                            </select>
                            <div className="pt-4 flex space-x-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy</button>
                                <button type="submit" disabled={submitLoading} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50">{submitLoading ? 'Đang tạo...' : 'Tạo Tài Khoản'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">Chi Tiết Người Dùng</h3>
                            <button onClick={() => { setShowDetailsModal(false); setSelectedUser(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {detailsLoading || !selectedUser ? (
                                <LoadingState label="Đang tải dữ liệu..." />
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">{selectedUser.name.charAt(0)}</div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-slate-800">{selectedUser.name}</h4>
                                            <p className="text-slate-500">{selectedUser.email}</p>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedUser.role === 'admin' ? 'bg-red-100 text-red-700' : selectedUser.role === 'instructor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {selectedUser.role?.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-xl">
                                            <p className="text-xs text-slate-500 mb-1">Trạng thái xác minh</p>
                                            <p className={`font-semibold ${selectedUser.is_verified ? 'text-green-600' : 'text-amber-600'}`}>
                                                {selectedUser.is_verified ? '✅ Đã xác minh' : '⏳ Chưa xác minh'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl">
                                            <p className="text-xs text-slate-500 mb-1">Ngày đăng ký</p>
                                            <p className="font-semibold text-slate-800">{new Date(selectedUser.created_at).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            📚 Khóa học đã đăng ký
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{selectedUser.enrolled_courses?.length || 0}</span>
                                        </h5>
                                        {(!selectedUser.enrolled_courses || selectedUser.enrolled_courses.length === 0) ? (
                                            <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-400 text-sm">
                                                Chưa đăng ký khóa học nào
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {selectedUser.enrolled_courses.map((course) => (
                                                    <div key={course.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-slate-800 truncate">{course.title}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${course.type === 'live' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                    {course.type === 'live' ? 'Trực tuyến' : 'Video'}
                                                                </span>
                                                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${course.enrollment_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                                    {course.enrollment_status === 'active' ? 'Đang học' : course.enrollment_status}
                                                                </span>
                                                                {course.enrolled_at && (
                                                                    <span className="text-xs text-slate-400">
                                                                        {new Date(course.enrolled_at).toLocaleDateString('vi-VN')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {course.payment_status && (
                                                            <span className={`text-xs px-2 py-1 rounded-lg font-bold ml-3 whitespace-nowrap ${course.payment_status === 'completed' ? 'bg-green-100 text-green-700' : course.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                {course.payment_status === 'completed' ? '✓ Đã TT' : course.payment_status === 'pending' ? '⏳ Chờ TT' : course.payment_status}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showGiftModal && giftUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">Tặng Khóa Học</h3>
                            <button onClick={() => setShowGiftModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleGiftCourse} className="p-6 space-y-4">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{giftUser.name.charAt(0)}</div>
                                <div>
                                    <p className="text-sm text-slate-500">Tặng cho học viên:</p>
                                    <p className="font-bold text-slate-800">{giftUser.name}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn khóa học để tặng</label>
                                <div className="max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl p-2 space-y-1">
                                    {courses.length === 0 ? (
                                        <p className="p-4 text-center text-sm text-slate-500">Không có khóa học nào đang xuất bản</p>
                                    ) : (
                                        courses.map(c => (
                                            <label key={c.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                                                <input 
                                                    type="checkbox" 
                                                    value={c.id}
                                                    checked={selectedCourseIds.includes(c.id.toString())}
                                                    onChange={(e) => {
                                                        const idStr = c.id.toString();
                                                        if (e.target.checked) {
                                                            setSelectedCourseIds(prev => [...prev, idStr]);
                                                        } else {
                                                            setSelectedCourseIds(prev => prev.filter(id => id !== idStr));
                                                        }
                                                    }}
                                                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800 leading-tight">{c.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description || 'Chưa có mô tả'}</p>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            <div className="pt-4 flex space-x-3">
                                <button type="button" onClick={() => setShowGiftModal(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy</button>
                                <button type="submit" disabled={giftLoading || selectedCourseIds.length === 0} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 flex justify-center items-center gap-2">
                                    {giftLoading ? 'Đang xử lý...' : <><span>🎁</span> Tặng Khóa Học</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
        </div>
    );
};

const UserRow = memo(({ user, onViewDetails, onVerifyInstructor, onDeleteUser, onGiftCourse }) => {
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
            <td className="p-4 font-mono text-slate-400">#{user.id}</td>
            <td className="p-4 font-semibold text-slate-800">{user.name}</td>
            <td className="p-4">{user.email}</td>
            <td className="p-4">
                <span className={`px-2.5 py-1 rounded text-xs font-bold inline-block ${user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'instructor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role.toUpperCase()}
                </span>
            </td>
            <td className="p-4 text-slate-500">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
            <td className="p-4 text-right">
                <div className="relative inline-block text-left" ref={menuRef}>
                    <button type="button" onClick={() => setMenuOpen((prev) => !prev)} className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors" aria-haspopup="true" aria-expanded={menuOpen}>
                        <span className="text-lg leading-none">⋮</span>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg z-30 py-1">
                            <button type="button" onClick={() => runAndCloseMenu(() => onViewDetails(user.id))} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors">Xem chi tiết</button>
                            {user.role === 'student' && <button type="button" onClick={() => runAndCloseMenu(() => onVerifyInstructor(user.id))} className="w-full px-4 py-2 text-left text-sm text-purple-700 hover:bg-purple-50 transition-colors">Cấp quyền GV</button>}
                            <button type="button" onClick={() => runAndCloseMenu(() => onGiftCourse(user))} className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 transition-colors border-t border-slate-100 font-medium">Tặng khóa học</button>
                            <button type="button" onClick={() => runAndCloseMenu(() => onDeleteUser(user.id))} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100">Xóa</button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
});
UserRow.displayName = 'UserRow';

export default UserManagement;
