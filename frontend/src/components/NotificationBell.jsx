import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services';
import { useToast } from '../contexts/ToastContext';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const { pushToast } = useToast();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await notificationService.getNotifications();
            const list = res?.data || [];
            setNotifications(list);
            setUnreadCount(list.filter((n) => !n.is_read).length);
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể tải thông báo', message: err.message });
        }
    };

    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể cập nhật', message: err.message });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể cập nhật', message: err.message });
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-slate-100 transition-colors" aria-label="Notifications">
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-slide-in-right">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-slate-800">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Bạn không có thông báo nào.</div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                    <div>
                                        <p className={`text-sm ${!notif.is_read ? 'text-slate-800 font-semibold' : 'text-slate-600'}`}>{notif.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString('vi-VN')}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;

