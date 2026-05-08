import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../../services';

const AdminDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        overview: { totalUsers: 0, totalCourses: 0, totalRevenue: 0 },
        activeLiveClasses: 0,
        charts: { monthlyRevenue: [] }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }

        const fetchStats = async () => {
            try {
                const data = await statsService.getDashboard();
                if (data) {
                    setStats(data);
                }
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu thống kê:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, navigate]);

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tổng Quan Hệ Thống</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start justify-center transition-all hover:shadow-md">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng Thành Viên</h3>
                    <div className="text-3xl font-black text-blue-600">{stats.overview.totalUsers}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start justify-center transition-all hover:shadow-md">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Khóa Học</h3>
                    <div className="text-3xl font-black text-green-600">{stats.overview.totalCourses}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start justify-center transition-all hover:shadow-md">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Doanh Thu (VNĐ)</h3>
                    <div className="text-3xl font-black text-amber-500">{stats.overview.totalRevenue.toLocaleString()} đ</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start justify-center transition-all hover:shadow-md">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lớp Live Đang Diễn Ra</h3>
                    <div className="text-3xl font-black text-purple-600">{stats.activeLiveClasses}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Biểu đồ doanh thu</h3>
                    {stats.charts.monthlyRevenue.length > 0 ? (
                        <div className="h-64 flex items-end space-x-2">
                             {/* Simple bar chart representation */}
                             {stats.charts.monthlyRevenue.map((item, i) => {
                                 const maxRev = Math.max(...stats.charts.monthlyRevenue.map(d => d.revenue));
                                 const height = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
                                 return (
                                     <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                                         <div 
                                            className="w-full bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600" 
                                            style={{height: `${Math.max(height, 5)}%`}}
                                            title={`${item.revenue.toLocaleString()} đ`}
                                         ></div>
                                         <span className="text-xs text-slate-400 mt-2 truncate w-full text-center">T{new Date(item.month).getMonth() + 1}</span>
                                     </div>
                                 )
                             })}
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-xl">Chưa có dữ liệu doanh thu</div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700">Chức năng đang được phát triển</span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 font-bold rounded">Sắp có</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
