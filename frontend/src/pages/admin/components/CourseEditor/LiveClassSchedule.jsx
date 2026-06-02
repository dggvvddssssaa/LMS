import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import httpClient from '../../../../services/core/httpClient';
import { useToast } from '../../../../contexts/ToastContext';

const STATUS_MAP = {
  scheduled: { label: 'Sắp diễn ra', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  open: { label: 'Đã mở phòng', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  ongoing: { label: 'Đang diễn ra', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  ended: { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-500', dot: 'bg-red-400' },
};

export default function LiveClassSchedule({ courseId }) {
  const { pushToast } = useToast();
  const [liveClass, setLiveClass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for new session
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newJoinMinutes, setNewJoinMinutes] = useState(15);

  // Editing state
  const [editingSession, setEditingSession] = useState(null);

  useEffect(() => {
    if (courseId) {
      initLiveClass();
      fetchTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchTeachers = async () => {
    try {
      const res = await httpClient.get('/users');
      if (res.data.success) {
        const instructors = (res.data.data || []).filter(
          u => u.role === 'instructor' || u.role === 'teacher' || u.role === 'admin'
        );
        setTeachers(instructors);
      }
    } catch (e) {
      console.error('Failed to fetch teachers', e);
    }
  };

  const initLiveClass = async () => {
    setLoading(true);
    try {
      let currentLiveClass = null;
      try {
        const res = await httpClient.get(`/live-classes/course/${courseId}`);
        if (res.data.success && res.data.data) {
          currentLiveClass = res.data.data;
        }
      } catch {
        // Not found, we will create it
      }

      if (!currentLiveClass) {
        const createRes = await httpClient.post('/live-classes', {
          course_id: courseId,
          status: 'upcoming'
        });
        currentLiveClass = createRes.data.data;
      }

      setLiveClass(currentLiveClass);
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
        teacher_id: newTeacherId ? Number(newTeacherId) : null,
        join_open_minutes: newJoinMinutes,
        status: 'scheduled'
      };
      const res = await httpClient.post('/sessions', data);
      if (res.data.success) {
        setSessions([...sessions, res.data.data]);
        setShowAddForm(false);
        setNewTitle('');
        setNewStartTime('');
        setNewEndTime('');
        setNewTeacherId('');
        setNewJoinMinutes(15);
        pushToast({ type: 'success', title: 'Thành công', message: 'Đã tạo buổi học mới' });
      }
    } catch {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể tạo buổi học' });
    }
  };

  const handleUpdateSession = async (id, updatedData) => {
    try {
      const res = await httpClient.put(`/sessions/${id}`, updatedData);
      if (res.data.success) {
        setSessions(sessions.map(s => s.id === id ? { ...s, ...res.data.data } : s));
        setEditingSession(null);
        pushToast({ type: 'success', title: 'Đã cập nhật' });
      }
    } catch {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể cập nhật buổi học' });
    }
  };

  const handleOpenSession = async (id) => {
    try {
      const res = await httpClient.put(`/sessions/${id}/open`);
      if (res.data.success) {
        setSessions(sessions.map(s => s.id === id ? { ...s, ...res.data.data } : s));
        pushToast({ type: 'success', title: '🟢 Đã mở lớp', message: 'Khóa học đã được xuất bản và học viên có thể tham gia ngay.' });
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Không thể mở lớp' });
    }
  };

  const handleEndSession = async (id) => {
    if (!confirm('Bạn có chắc muốn kết thúc buổi học này?')) return;
    try {
      const res = await httpClient.put(`/sessions/${id}/end`);
      if (res.data.success) {
        setSessions(sessions.map(s => s.id === id ? { ...s, ...res.data.data } : s));
        pushToast({ type: 'success', title: '🔴 Đã kết thúc lớp' });
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Không thể kết thúc lớp' });
    }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa buổi học này?')) return;
    try {
      await httpClient.delete(`/sessions/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
      pushToast({ type: 'success', title: 'Đã xóa buổi học' });
    } catch {
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
          <p className="text-slate-500 mt-1">Quản lý các buổi học qua WebRTC — chọn giáo viên đứng lớp, mở/kết thúc phòng</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
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
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Giáo viên đứng lớp</label>
              <select
                value={newTeacherId}
                onChange={e => setNewTeacherId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                <option value="">— Chọn giáo viên —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Cho phép vào trước (phút)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={newJoinMinutes}
                onChange={e => setNewJoinMinutes(Number(e.target.value))}
                className="w-32 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none font-bold"
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
          sessions.map((session, idx) => {
            const statusInfo = STATUS_MAP[session.status] || STATUS_MAP.scheduled;
            const isEditing = editingSession === session.id;

            return (
              <div key={session.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
                    {idx + 1}
                  </div>

                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
                      <input
                        defaultValue={session.title}
                        id={`title-${session.id}`}
                        className="px-3 py-2 border rounded-xl"
                        placeholder="Tên buổi học"
                      />
                      <input
                        type="datetime-local"
                        defaultValue={session.start_time ? new Date(session.start_time).toISOString().slice(0, 16) : ''}
                        id={`start-${session.id}`}
                        className="px-3 py-2 border rounded-xl"
                      />
                      <select
                        defaultValue={session.teacher_id || ''}
                        id={`teacher-${session.id}`}
                        className="px-3 py-2 border rounded-xl"
                      >
                        <option value="">— Chọn GV —</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          const title = document.getElementById(`title-${session.id}`).value;
                          const start = document.getElementById(`start-${session.id}`).value;
                          const teacherId = document.getElementById(`teacher-${session.id}`).value;
                          handleUpdateSession(session.id, {
                            title,
                            start_time: start,
                            teacher_id: teacherId ? Number(teacherId) : null
                          });
                        }} className="flex-1 bg-green-500 text-white rounded-xl font-bold py-2 hover:bg-green-600 transition">Lưu</button>
                        <button onClick={() => setEditingSession(null)} className="flex-1 bg-slate-200 text-slate-700 rounded-xl font-bold py-2 hover:bg-slate-300 transition">Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-slate-800 mb-1">{session.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                            {new Date(session.start_time).toLocaleString('vi-VN')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-semibold text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {session.teacher_name && (
                            <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                              👨‍🏫 {session.teacher_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-wrap">
                        {/* Open / End buttons based on status */}
                        {(session.status === 'scheduled') && (
                          <button
                            onClick={() => handleOpenSession(session.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition shadow-sm"
                          >
                            🟢 Mở lớp
                          </button>
                        )}
                        {(session.status === 'open' || session.status === 'ongoing') && (
                          <>
                            <Link
                              to={`/session/${session.meeting_id}/join`}
                              className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition shadow-sm"
                            >
                              🎥 Vào lớp
                            </Link>
                            <button
                              onClick={() => handleEndSession(session.id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition shadow-sm"
                            >
                              🔴 Kết thúc
                            </button>
                          </>
                        )}
                        {session.status === 'ended' && session.meeting_id && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold">Đã kết thúc</span>
                        )}
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

                {/* Meeting ID copy row */}
                {!isEditing && session.meeting_id && (
                  <div className="mt-3 ml-16 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Meeting ID:</span>
                    <code className="text-xs bg-slate-50 px-2 py-1 rounded text-slate-600 font-mono">{session.meeting_id}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(session.meeting_id); pushToast({ type: 'success', title: 'Đã copy' }); }}
                      className="text-xs text-blue-500 hover:text-blue-700 font-bold"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
