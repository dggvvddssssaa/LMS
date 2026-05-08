import React, { useState, useEffect } from 'react';
import httpClient from '../../../../services/core/httpClient';
import { useToast } from '../../../../contexts/ToastContext';

export default function LiveClassSchedule({ courseId }) {
  const { pushToast } = useToast();
  const [liveClass, setLiveClass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state for new session
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  // Editing state
  const [editingSession, setEditingSession] = useState(null);

  useEffect(() => {
    if (courseId) {
      initLiveClass();
    }
  }, [courseId]);

  const initLiveClass = async () => {
    setLoading(true);
    try {
      let currentLiveClass = null;
      // 1. Get live class by courseId
      try {
        const res = await httpClient.get(`/live-classes/course/${courseId}`);
        if (res.data.success && res.data.data) {
          currentLiveClass = res.data.data;
        }
      } catch (e) {
        // Not found, we will create it
      }

      // 2. If not found, create it
      if (!currentLiveClass) {
        const createRes = await httpClient.post('/live-classes', {
          course_id: courseId,
          status: 'upcoming'
        });
        currentLiveClass = createRes.data.data;
      }

      setLiveClass(currentLiveClass);

      // 3. Fetch sessions
      if (currentLiveClass) {
        await fetchSessions(currentLiveClass.id);
      }
    } catch (err) {
      console.error('Failed to init live class', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (lcId) => {
    try {
      const res = await httpClient.get(`/sessions/live-class/${lcId}`);
      if (res.data.success) {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSession = async () => {
    if (!newTitle || !newStartTime) {
      return pushToast({ type: 'error', title: 'Thiếu thông tin', message: 'Vui lòng nhập tên buổi học và thời gian bắt đầu' });
    }
    try {
      const data = {
        live_class_id: liveClass.id,
        title: newTitle,
        start_time: newStartTime,
        end_time: newEndTime || null,
        status: 'scheduled'
      };
      const res = await httpClient.post('/sessions', data);
      if (res.data.success) {
        setSessions([...sessions, res.data.data]);
        setShowAddForm(false);
        setNewTitle('');
        setNewStartTime('');
        setNewEndTime('');
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể tạo buổi học' });
    }
  };

  const handleUpdateSession = async (id, updatedData) => {
    try {
      const res = await httpClient.put(`/sessions/${id}`, updatedData);
      if (res.data.success) {
        setSessions(sessions.map(s => s.id === id ? res.data.data : s));
        setEditingSession(null);
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể cập nhật buổi học' });
    }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa buổi học này?')) return;
    try {
      await httpClient.delete(`/sessions/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa buổi học' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse bg-white rounded-3xl border border-slate-100 shadow-sm">Đang tải lịch học trực tiếp...</div>;
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="text-3xl">📅</span> Lịch Học Trực Tiếp
          </h2>
          <p className="text-slate-500 mt-1">Quản lý các buổi học qua WebRTC</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <span>+</span> Thêm Buổi Học
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl animate-fade-in shadow-inner">
          <h3 className="font-bold text-slate-800 mb-4">Thêm buổi học mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Tên buổi học</label>
              <input 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                placeholder="VD: Buổi 1: Tổng quan"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Thời gian bắt đầu</label>
              <input 
                type="datetime-local"
                value={newStartTime} 
                onChange={e => setNewStartTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Dự kiến kết thúc</label>
              <input 
                type="datetime-local"
                value={newEndTime} 
                onChange={e => setNewEndTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAddForm(false)} className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">Hủy</button>
            <button onClick={handleAddSession} className="px-5 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20">Lưu Buổi Học</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Chưa có buổi học nào được tạo.
          </div>
        ) : (
          sessions.map((session, idx) => (
            <div key={session.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
                {idx + 1}
              </div>
              
              {editingSession === session.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                  <input 
                    defaultValue={session.title} 
                    id={`title-${session.id}`}
                    className="px-3 py-2 border rounded-xl" 
                  />
                  <input 
                    type="datetime-local" 
                    defaultValue={session.start_time ? new Date(session.start_time).toISOString().slice(0,16) : ''} 
                    id={`start-${session.id}`}
                    className="px-3 py-2 border rounded-xl" 
                  />
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const title = document.getElementById(`title-${session.id}`).value;
                      const start = document.getElementById(`start-${session.id}`).value;
                      handleUpdateSession(session.id, { title, start_time: start });
                    }} className="flex-1 bg-green-500 text-white rounded-xl font-bold py-2">Lưu</button>
                    <button onClick={() => setEditingSession(null)} className="flex-1 bg-slate-200 text-slate-700 rounded-xl font-bold py-2">Hủy</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-800 mb-1">{session.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        {new Date(session.start_time).toLocaleString('vi-VN')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-xs">
                        {session.status === 'scheduled' ? 'Sắp diễn ra' : session.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingSession(session.id)} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition">
                      ✏️
                    </button>
                    <button onClick={() => handleDeleteSession(session.id)} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-slate-400 transition">
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

