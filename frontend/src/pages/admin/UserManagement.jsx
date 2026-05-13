import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { adminService } from '../../services';
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

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user, fetchUsers]);

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
                                <UserRow key={u.id} user={u} onViewDetails={handleViewDetails} onVerifyInstructor={handleVerifyInstructor} onDeleteUser={handleDeleteUser} />
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
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">{selectedUser.name.charAt(0)}</div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-800">{selectedUser.name}</h4>
                                            <p className="text-slate-500">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
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

const UserRow = memo(({ user, onViewDetails, onVerifyInstructor, onDeleteUser }) => {
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
                            <button type="button" onClick={() => runAndCloseMenu(() => onDeleteUser(user.id))} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">Xóa</button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
});
UserRow.displayName = 'UserRow';

export default UserManagement;
