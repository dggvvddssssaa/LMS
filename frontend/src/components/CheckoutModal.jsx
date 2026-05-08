import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { enrollmentService } from '../services';
import { useToast } from '../contexts/ToastContext';

const PAYMENT_TIMEOUT = 15 * 60;

const CheckoutModal = ({ course, isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [qrConfig, setQrConfig] = useState(null);
    const [transactionId, setTransactionId] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(PAYMENT_TIMEOUT);

    const { user } = useAuthStore();
    const { pushToast } = useToast();
    const navigate = useNavigate();
    const countdownRef = useRef(null);

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setQrConfig(null);
            setTransactionId(null);
            setPaymentStatus(null);
            setError('');
            setCountdown(PAYMENT_TIMEOUT);
            setLoading(false);
            setConfirming(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCheckout = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await enrollmentService.checkout(course.id);
            const data = res.data;

            if (data.type === 'free') {
                pushToast({ type: 'success', title: 'Đăng ký thành công' });
                navigate(`/course/${course.id}/learn`);
            } else {
                setQrConfig(data.vietQrConfig);
                setTransactionId(data.transactionId);
                setPaymentStatus('pending');

                setCountdown(PAYMENT_TIMEOUT);
                countdownRef.current = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(countdownRef.current);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } catch (err) {
            const message = err.message || 'Có lỗi xảy ra khi tạo giao dịch.';
            setError(message);
            pushToast({ type: 'error', title: 'Không thể tạo giao dịch', message });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!transactionId) return;

        try {
            setConfirming(true);
            setError('');
            const res = await enrollmentService.confirmCheckout(transactionId);
            const data = res.data;
            setPaymentStatus('confirmed');

            if (countdownRef.current) clearInterval(countdownRef.current);
            pushToast({ type: 'success', title: 'Thanh toán thành công' });

            setTimeout(() => {
                navigate(`/course/${data.courseId || course.id}/learn`);
            }, 1500);
        } catch (err) {
            const message = err.message || 'Xác nhận thanh toán thất bại. Vui lòng thử lại.';
            setError(message);
            pushToast({ type: 'error', title: 'Xác nhận thất bại', message });
        } finally {
            setConfirming(false);
        }
    };

    const actualPrice = parseFloat(course.sale_price) > 0 ? course.sale_price : course.price;
    const isFree = parseFloat(actualPrice) === 0;

    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10">
                    ×
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Thanh toán khóa học</h2>
                    <p className="text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">Xác nhận thông tin mua khóa học của bạn</p>

                    <div className="flex gap-4 items-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                        ) : (
                            <div className="w-20 h-20 bg-primary/10 flex items-center justify-center rounded-lg text-primary text-2xl font-bold">
                                {course.title.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-slate-800 line-clamp-1">{course.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">Giảng viên: {course.instructor_name}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-900">
                        <span className="font-semibold">Tổng thanh toán:</span>
                        <div className="text-right">
                            <span className="text-2xl font-extrabold text-primary">
                                {isFree ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(actualPrice)}
                            </span>
                        </div>
                    </div>

                    {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

                    {paymentStatus === 'confirmed' ? (
                        <div className="text-center animate-fade-in bg-green-50 p-8 rounded-2xl border border-green-200">
                            <div className="text-5xl mb-4">🎉</div>
                            <h4 className="text-xl font-bold text-green-700 mb-2">Thanh toán thành công!</h4>
                            <p className="text-green-600 text-sm">Đang chuyển đến trang học...</p>
                        </div>
                    ) : qrConfig ? (
                        <div className="text-center animate-fade-in bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h4 className="font-bold text-slate-700 mb-4">Quét mã QR bằng App Ngân hàng</h4>
                            <img
                                src={`https://img.vietqr.io/image/${qrConfig.bank}-${qrConfig.accountNo}-compact2.png?amount=${qrConfig.amount}&addInfo=${encodeURIComponent(qrConfig.description)}&accountName=${encodeURIComponent(qrConfig.accountName)}`}
                                alt="Mã QR Thanh Toán"
                                className="mx-auto rounded-xl shadow-lg border-4 border-white mb-4 w-60 h-60"
                            />
                            {countdown > 0 ? (
                                <div className="mb-4 text-sm text-slate-500">Thời gian còn lại: <span className="font-mono font-bold text-slate-700">{formatCountdown(countdown)}</span></div>
                            ) : (
                                <div className="mb-4 text-sm text-amber-600 font-semibold">Hết thời gian. Vui lòng tạo giao dịch mới.</div>
                            )}
                            <button
                                onClick={handleConfirmPayment}
                                disabled={confirming || countdown === 0}
                                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition disabled:opacity-50"
                            >
                                {confirming ? 'Đang xác nhận...' : 'Xác nhận đã thanh toán'}
                            </button>
                        </div>
                    ) : (
                        <button
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition disabled:opacity-70 disabled:cursor-not-allowed"
                            onClick={handleCheckout}
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : isFree ? 'Vào Học Ngay' : 'Xác Nhận & Thanh Toán'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
