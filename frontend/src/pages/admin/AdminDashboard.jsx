import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../../services';
import { useToast } from '../../contexts/ToastContext';

const AdminDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const [stats, setStats] = useState({
        overview: { totalUsers: 0, totalCourses: 0, totalRevenue: 0 },
        activeLiveClasses: 0,
        charts: { monthlyRevenue: [] }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await statsService.getDashboard();
                if (res && res.success && res.data) {
                    setStats(res.data);
                } else {
                    console.warn('API không trả về success hoặc thiếu data:', res);
                    pushToast({ type: 'warning', title: 'Cảnh báo', message: (res?.message) || 'Không thể tải đầy đủ dữ liệu thống kê' });
                }
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu thống kê:', error);
                pushToast({ type: 'error', title: 'Lỗi', message: 'Có lỗi xảy ra khi kết nối máy chủ' });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, navigate, pushToast]);

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;

    // Default fallbacks in case data is partial to prevent runtime crashes
    const safeOverview = stats?.overview || { totalUsers: 0, totalCourses: 0, totalRevenue: 0 };
    const safeCharts = stats?.charts || { monthlyRevenue: [] };

    return (
        <div className="-mx-4 lg:-mx-8 -my-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white py-12 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
                <div className="container mx-auto max-w-7xl relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Tổng Quan Hệ Thống</h1>
                    <p className="text-lg md:text-xl text-blue-100 opacity-90 max-w-2xl">Theo dõi các số liệu quan trọng và hoạt động gần đây của hệ thống giáo dục.</p>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start justify-center transition-all hover:shadow-md hover:-translate-y-1">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Tổng Thành Viên</h3>
                        <div className="text-4xl font-black text-blue-600">{safeOverview.totalUsers || 0}</div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start justify-center transition-all hover:shadow-md hover:-translate-y-1">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Khóa Học</h3>
                        <div className="text-4xl font-black text-green-600">{safeOverview.totalCourses || 0}</div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start justify-center transition-all hover:shadow-md hover:-translate-y-1">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Doanh Thu (VNĐ)</h3>
                        <div className="text-4xl font-black text-amber-500">{(safeOverview.totalRevenue || 0).toLocaleString()} đ</div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start justify-center transition-all hover:shadow-md hover:-translate-y-1">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Lớp Live Đang Diễn Ra</h3>
                        <div className="text-4xl font-black text-purple-600">{stats.activeLiveClasses}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                        <h3 className="text-xl font-extrabold text-slate-800 mb-6">Biểu đồ doanh thu</h3>
                        {safeCharts.monthlyRevenue && safeCharts.monthlyRevenue.length > 0 ? (
                            <div className="h-72 flex items-end space-x-3">
                                 {safeCharts.monthlyRevenue.map((item, i) => {
                                     const maxRev = Math.max(...safeCharts.monthlyRevenue.map(d => d.revenue || 0));
                                     const height = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
                                     return (
                                         <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                                             <div 
                                                className="w-full bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-600 group-hover:shadow-lg" 
                                                style={{height: `${Math.max(height, 5)}%`}}
                                                title={`${item.revenue.toLocaleString()} đ`}
                                             ></div>
                                             <span className="text-sm font-bold text-slate-400 mt-3 truncate w-full text-center">T{new Date(item.month).getMonth() + 1}</span>
                                         </div>
                                     )
                                 })}
                            </div>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-2xl">Chưa có dữ liệu doanh thu</div>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                        <h3 className="text-xl font-extrabold text-slate-800 mb-6">Hoạt động gần đây</h3>
                        <div className="space-y-4">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:bg-slate-100 transition-colors">
                                <span className="text-base font-bold text-slate-700">Chức năng đang được phát triển</span>
                                <span className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 font-black uppercase tracking-wider rounded-lg">Sắp có</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
