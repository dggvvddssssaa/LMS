import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';
import { useToast } from '../../contexts/ToastContext';
import { ErrorState, LoadingState } from '../../components/ui';

const SessionCreate = () => {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('courseId');
    const navigate = useNavigate();
    const { pushToast } = useToast();

    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [course, setCourse] = useState(null);
    const [courseLoading, setCourseLoading] = useState(true);

    useEffect(() => {
        if (!courseId) {
            setCourseLoading(false);
            return;
        }

        setCourseLoading(true);
        httpClient.get(`/courses/${courseId}`).then(res => {
            if (res.data.success) {
                setCourse(res.data.data);
            }
        }).catch(() => {
            setError('Không thể tải thông tin khóa học');
        }).finally(() => {
            setCourseLoading(false);
        });
    }, [courseId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!course?.live_class_details?.id) {
                throw new Error('Khóa học chưa được cấu hình Lớp Live đúng cách.');
            }

            const res = await httpClient.post(`/sessions`, {
                liveClassId: course.live_class_details.id,
                title,
                start_time: startTime || new Date().toISOString(),
            });

            if (res.data.success) {
                pushToast({ type: 'success', title: 'Lên lịch thành công' });
                navigate(`/teacher/course/${courseId}`);
            }
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Lỗi hệ thống';
            setError(message);
            pushToast({ type: 'error', title: 'Không thể tạo phiên live', message });
        } finally {
            setLoading(false);
        }
    };

    if (!courseId) {
        return <ErrorState title="Thiếu mã khóa học" message="Không tìm thấy mã khóa học trong URL." />;
    }

    if (courseLoading) {
        return <LoadingState label="Đang tải thông tin khóa học..." fullHeight />;
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl animate-fade-in">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border-t-4 border-t-purple-500 border border-slate-100">
                <h1 className="text-2xl md:text-3xl font-extrabold mb-2 text-slate-800 tracking-tight">Lên Lịch Phiên Live</h1>
                <p className="text-slate-500 mb-8">{course ? `Cho khóa học: ${course.title}` : 'Không tìm thấy thông tin khóa học.'}</p>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-medium text-sm">{error}</div>}

                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Chủ đề Buổi học</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-slate-800"
                            placeholder="VD: Tuần 1 - Giải đáp thắc mắc"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Thời gian Bắt đầu</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-slate-800"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-8">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold transition-colors text-sm"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !course}
                            className={`px-8 py-2.5 rounded-xl text-white font-bold transition-all shadow-md active:scale-95 text-sm ${loading || !course ? 'bg-purple-300 shadow-none cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'}`}
                        >
                            {loading ? 'Đang lưu...' : 'Lên Lịch Ngay'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SessionCreate;

