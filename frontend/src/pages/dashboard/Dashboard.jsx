import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import httpClient from "../../services/core/httpClient";

const Dashboard = () => {
    const [courses, setCourses] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('courses');
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchMyCourses = async () => {
            if (!user) return;
            try {
                const res = await httpClient.get('/enrollments/my-courses');
                if (res.data.success) {
                    setCourses(res.data.data.map(e => ({
                        id: e.course_id,
                        title: e.title,
                        progress: parseFloat(e.progress) || 0,
                        type: e.type,
                        thumbnail: e.thumbnail,
                        enrolledAt: e.created_at,
                    })));
                }
            } catch (err) {
                console.error('Error fetching courses:', err);
            }
        };
        const fetchReceipts = async () => {
            if (!user || user.role !== 'student') return;
            try {
                const res = await httpClient.get('/enrollments/receipts');
                if (res.data.success) setReceipts(res.data.data);
            } catch (err) { console.error(err); }
        };
        const fetchCertificates = async () => {
            if (!user || user.role !== 'student') return;
            try {
                const res = await httpClient.get('/certificates');
                if (res.data.success) setCertificates(res.data.data);
            } catch (err) { console.error(err); }
        };
        const fetchNotifications = async () => {
            if (!user) return;
            try {
                const res = await httpClient.get('/notifications');
                if (res.data.success) setNotifications(res.data.data.filter(n => !n.is_read).slice(0, 5));
            } catch (err) { console.error(err); }
        };
        fetchMyCourses();
        fetchReceipts();
        fetchCertificates();
        fetchNotifications();
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await httpClient.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
            <h1 className="text-3xl font-extrabold mb-8 text-slate-800 tracking-tight">Xin chào, {user?.name || 'Học viên'}!</h1>

            {notifications.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="text-2xl">🔔</span> Thông báo mới</h2>
                    <div className="flex flex-col gap-3">
                        {notifications.map(noti => (
                            <div key={noti.id} className="bg-white border-l-4 border-blue-500 rounded-r-xl p-4 shadow-sm flex justify-between items-center animate-fade-in">
                                <div>
                                    <p className="text-slate-800 font-medium">{noti.message}</p>
                                    <span className="text-xs text-slate-400 mt-1 block">{new Date(noti.created_at).toLocaleString('vi-VN')}</span>
                                </div>
                                <button onClick={() => markAsRead(noti.id)} className="text-blue-600 text-sm hover:underline whitespace-nowrap ml-4">
                                    Đánh dấu đã đọc
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 mb-10 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-black mb-2">Tiếp tục hành trình học tập</h2>
                    <p className="text-blue-100 mb-6 font-medium text-lg leading-relaxed">Duy trì tiến độ mỗi ngày để đạt mục tiêu của bạn.</p>
                    <Link to="/courses" className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl shadow-sm hover:bg-slate-50 transition-colors inline-block">
                        Khám phá khóa học mới
                    </Link>
                </div>
            </div>

            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button onClick={() => setActiveTab('courses')} className={`pb-4 px-2 font-bold text-lg border-b-2 ${activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                    Khóa học của tôi
                </button>
                {user?.role === 'student' && (
                    <>
                        <button onClick={() => setActiveTab('receipts')} className={`pb-4 px-2 font-bold text-lg border-b-2 ${activeTab === 'receipts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                            Hóa đơn
                        </button>
                        <button onClick={() => setActiveTab('certificates')} className={`pb-4 px-2 font-bold text-lg border-b-2 ${activeTab === 'certificates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                            Chứng chỉ
                        </button>
                    </>
                )}
            </div>

            {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow group flex flex-col">
                            <div className="h-32 bg-slate-100">
                                {course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />}
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="font-bold text-lg mb-6 text-slate-800 line-clamp-2 min-h-[56px] leading-tight">{course.title}</h3>
                                <div className="mt-auto">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-bold text-slate-600">{course.progress}%</span>
                                        <span className="text-xs text-slate-400 font-medium">{course.progress === 100 ? 'Hoàn thành' : 'Đang học'}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
                                        <div className={`h-2 rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${course.progress}%` }} />
                                    </div>
                                    <Link to={`/course/${course.id}`} className="block text-center text-primary font-bold px-4 py-3 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors w-full border border-blue-100">
                                        Tiếp tục học
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {courses.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-400">
                            <span className="text-4xl block mb-3">📚</span>
                            Bạn chưa đăng ký khóa học nào. <Link to="/courses" className="text-blue-600 font-bold hover:underline">Khám phá ngay</Link>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'receipts' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                    <th className="p-4 font-semibold">Mã giao dịch</th>
                                    <th className="p-4 font-semibold">Khóa học</th>
                                    <th className="p-4 font-semibold">Số tiền</th>
                                    <th className="p-4 font-semibold">Ngày thanh toán</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receipts.map(receipt => (
                                    <tr key={receipt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-sm text-slate-600">{receipt.transaction_id}</td>
                                        <td className="p-4 font-semibold text-slate-800">{receipt.course_title}</td>
                                        <td className="p-4 font-bold text-blue-600">{parseInt(receipt.amount, 10).toLocaleString('vi-VN')}đ</td>
                                        <td className="p-4 text-slate-500 text-sm">{new Date(receipt.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
                                    </tr>
                                ))}
                                {receipts.length === 0 && (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-500">Chưa có giao dịch.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'certificates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map(cert => (
                        <Link key={cert.id} to={`/certificate/${cert.id}`} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center shadow-sm hover:shadow-lg hover:border-amber-200 transition-all group">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full flex items-center justify-center mb-4 border-4 border-amber-100 group-hover:scale-110 transition-transform">
                                <span className="text-3xl">🏅</span>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-amber-800 transition-colors">{cert.course_title}</h3>
                            <p className="text-sm text-slate-500 mb-4">Cấp ngày: <span className="font-semibold text-slate-700">{new Date(cert.issued_at).toLocaleDateString('vi-VN')}</span></p>
                            <div className="w-full py-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 font-bold rounded-xl group-hover:from-amber-100 group-hover:to-yellow-100 transition-colors text-center border border-amber-100">
                                Xem chứng chỉ →
                            </div>
                        </Link>
                    ))}
                    {certificates.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-400">
                            <span className="text-4xl block mb-3">🏅</span>
                            Chưa có chứng chỉ. Hoàn thành khóa học để nhận chứng chỉ.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;

