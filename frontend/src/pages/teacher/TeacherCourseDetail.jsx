import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { courseService } from "../../services";
import httpClient from "../../services/core/httpClient";
import { getLessonTypeMeta } from "../../constants/courseStructureMedia";
import { useToast } from "../../contexts/ToastContext";
import useConfirmDialog from "../../hooks/useConfirmDialog";
import useAuthStore from "../../store/useAuthStore";
import { ConfirmDialog, ErrorState, LoadingState } from "../../components/ui";

const STATUS_MAP = {
    scheduled: { label: 'Sắp diễn ra', color: 'bg-amber-100 text-amber-700', icon: '📅' },
    open: { label: 'Đã mở phòng', color: 'bg-blue-100 text-blue-700', icon: '🟢' },
    ongoing: { label: 'Đang diễn ra', color: 'bg-green-100 text-green-700', icon: '🎥' },
    ended: { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-500', icon: '✅' },
};

const inferContentType = (contentUrl, contentText) => {
  const hasUrl = Boolean((contentUrl || "").trim());
  const hasText = Boolean((contentText || "").trim());

  if (hasUrl && !hasText) return "video";
  if (!hasUrl && hasText) return "text";
  if (hasUrl && hasText) return "document";
  return "text";
};

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const { pushToast } = useToast();
  const { user } = useAuthStore();
  const { confirmState, openConfirm, closeConfirm, handleConfirm } = useConfirmDialog();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessions, setSessions] = useState([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [addingLessonToSection, setAddingLessonToSection] = useState(null);
  const [newLesson, setNewLesson] = useState({ title: "", content_url: "", content_text: "" });

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const courseRes = await courseService.getCourseById(id);
      if (courseRes.success) {
        setCourse(courseRes.data);
        // Fetch sessions if live/hybrid
        if (courseRes.data.type === 'live' || courseRes.data.type === 'hybrid') {
          try {
            if (courseRes.data.live_class_details?.id) {
              const sRes = await httpClient.get(`/sessions/live-class/${courseRes.data.live_class_details.id}`);
              setSessions(sRes.data.data || []);
            }
          } catch (e) {
            console.error('Failed to load sessions', e);
          }
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    try {
      await httpClient.post("/sections", {
        course_id: parseInt(id, 10),
        title: newSectionTitle,
        order_index: course?.sections?.length || 0,
      });
      setNewSectionTitle("");
      pushToast({ type: "success", title: "Đã thêm phần học" });
      fetchCourseData();
    } catch (err) {
      pushToast({ type: "error", title: "Không thể thêm phần", message: err.response?.data?.message || err.message });
    }
  };

  const handleUpdateSection = async (sectionId) => {
    try {
      await httpClient.put(`/sections/${sectionId}`, { title: editingSectionTitle });
      setEditingSectionId(null);
      pushToast({ type: "success", title: "Đã cập nhật phần học" });
      fetchCourseData();
    } catch (err) {
      pushToast({ type: "error", title: "Không thể cập nhật phần", message: err.response?.data?.message || err.message });
    }
  };

  const handleDeleteSection = async (sectionId) => {
    openConfirm({
      title: "Xóa phần học",
      message: "Xóa phần này sẽ xóa tất cả bài giảng bên trong. Bạn chắc chắn?",
      onConfirm: async () => {
        try {
          await httpClient.delete(`/sections/${sectionId}`);
          pushToast({ type: "success", title: "Đã xóa phần học" });
          fetchCourseData();
        } catch (err) {
          pushToast({ type: "error", title: "Không thể xóa phần", message: err.response?.data?.message || err.message });
        }
      },
    });
  };

  const handleAddLesson = async (e, sectionId) => {
    e.preventDefault();
    if (!newLesson.title.trim()) return;

    const payload = {
      section_id: sectionId,
      title: newLesson.title,
      content_type: inferContentType(newLesson.content_url, newLesson.content_text),
      content_url: newLesson.content_url?.trim() || null,
      content_text: newLesson.content_text?.trim() || null,
      order_index: 0,
    };

    try {
      await httpClient.post("/lessons", payload);
      setNewLesson({ title: "", content_url: "", content_text: "" });
      setAddingLessonToSection(null);
      pushToast({ type: "success", title: "Đã thêm bài giảng" });
      fetchCourseData();
    } catch (err) {
      pushToast({ type: "error", title: "Không thể thêm bài giảng", message: err.response?.data?.message || err.message });
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    openConfirm({
      title: "Xóa bài giảng",
      message: "Bạn có chắc chắn muốn xóa bài giảng này?",
      onConfirm: async () => {
        try {
          await httpClient.delete(`/lessons/${lessonId}`);
          pushToast({ type: "success", title: "Đã xóa bài giảng" });
          fetchCourseData();
        } catch (err) {
          pushToast({ type: "error", title: "Không thể xóa bài giảng", message: err.response?.data?.message || err.message });
        }
      },
    });
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      if (!course?.live_class_details?.id) {
        pushToast({ type: "error", title: "Chưa cấu hình lớp học live" });
        return;
      }
      const res = await httpClient.post("/sessions", {
        liveClassId: course.live_class_details.id,
        title: sessionTitle,
        start_time: new Date().toISOString(),
        teacher_id: user?.id,
      });
      pushToast({ type: "success", title: "Đã lên lịch ca học live" });
      setSessionTitle("");
      // Add session to list
      if (res.data?.data) {
        setSessions(prev => [...prev, res.data.data]);
      }
    } catch {
      pushToast({ type: "error", title: "Không thể tạo ca học" });
    }
  };

  const handleOpenSession = async (sessionId) => {
    try {
      const res = await httpClient.put(`/sessions/${sessionId}/open`);
      if (res.data.success) {
        setSessions(prev => prev.map(s =>
          s.id === sessionId ? { ...s, ...res.data.data } : s
        ));
        pushToast({ type: "success", title: "🟢 Đã mở lớp", message: "Lớp học đã sẵn sàng." });
      }
    } catch (err) {
      pushToast({ type: "error", title: "Lỗi", message: err.response?.data?.message || "Không thể mở lớp" });
    }
  };

  const handleEndSession = async (sessionId) => {
    openConfirm({
      title: "Kết thúc buổi học",
      message: "Bạn có chắc chắn muốn kết thúc buổi học này? Học viên sẽ không thể tham gia lại.",
      onConfirm: async () => {
        try {
          const res = await httpClient.put(`/sessions/${sessionId}/end`);
          if (res.data.success) {
            setSessions(prev => prev.map(s =>
              s.id === sessionId ? { ...s, ...res.data.data } : s
            ));
            pushToast({ type: "success", title: "Đã kết thúc buổi học" });
          }
        } catch (err) {
          pushToast({ type: "error", title: "Lỗi", message: err.response?.data?.message || "Không thể kết thúc lớp" });
        }
      },
    });
  };

  if (loading) return <LoadingState label="Đang tải cấu trúc khóa học..." fullHeight />;
  if (error) return <ErrorState message={error.message} onRetry={fetchCourseData} />;
  if (!course) return <ErrorState title="Không tìm thấy khóa học" />;

  const sections = course.sections || [];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <Link to="/teacher/dashboard" className="text-sm text-slate-500 hover:text-blue-600 mb-4 inline-block font-medium transition-colors">&larr; Quay lại Tủ Sách Giảng Viên</Link>
        <div className="flex gap-4 items-center flex-wrap">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{course.title}</h1>
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${course.type === "live" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
            {course.type === "live" ? "Lớp Trực Tuyến" : course.type === "hybrid" ? "Hỗn hợp" : "Khóa Học Video"}
          </span>
        </div>
      </div>

      {(course.type === "live" || course.type === "hybrid") && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 mb-8 border-t-4 border-t-purple-500">
          <h2 className="text-xl font-bold mb-6 text-slate-800">🎥 Quản Lý Phòng Học Trực Tuyến</h2>
          
          {/* Create new session */}
          <form onSubmit={handleCreateSession} className="flex flex-col sm:flex-row gap-4 mb-6">
            <input type="text" placeholder="VD: Buổi 1 - Lập trình cơ bản" className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} required />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md whitespace-nowrap">+ Tạo Ca Học Mới</button>
          </form>

          {/* Sessions list */}
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Chưa có buổi học nào. Tạo ca học mới để bắt đầu dạy.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => {
                const statusInfo = STATUS_MAP[session.status] || STATUS_MAP.scheduled;
                return (
                  <div key={session.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-purple-200 transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{statusInfo.icon}</span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 truncate">{session.title}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              🕐 {new Date(session.start_time).toLocaleString('vi-VN')}
                            </span>
                            {session.meeting_id && (
                              <span className="text-xs text-slate-400 font-mono">
                                ID: {session.meeting_id.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {session.status === 'scheduled' && (
                          <button
                            onClick={() => handleOpenSession(session.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition shadow-sm"
                          >
                            🟢 Mở lớp
                          </button>
                        )}
                        {(session.status === 'open' || session.status === 'ongoing') && session.meeting_id && (
                          <>
                            <Link
                              to={`/session/${session.meeting_id}/join`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition text-center shadow-sm"
                            >
                              🎥 Vào dạy
                            </Link>
                            <button
                              onClick={() => handleEndSession(session.id)}
                              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition"
                            >
                              Kết thúc
                            </button>
                          </>
                        )}
                        {(session.status === 'open' || session.status === 'ongoing') && !session.meeting_id && (
                          <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm">
                            ⚠️ Thiếu Meeting ID
                          </span>
                        )}
                        {session.status === 'ended' && (
                          <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm">
                            Đã kết thúc
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 border-t-4 border-t-blue-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Cấu Trúc Khóa Học</h2>
          <span className="text-sm text-slate-400">{sections.length} phần</span>
        </div>

        <div className="space-y-4 mb-6">
          {sections.map((section, sIdx) => (
            <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                {editingSectionId === section.id ? (
                  <div className="flex gap-2 items-center flex-1">
                    <input value={editingSectionTitle} onChange={(e) => setEditingSectionTitle(e.target.value)} className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm" />
                    <button onClick={() => handleUpdateSection(section.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Lưu</button>
                    <button onClick={() => setEditingSectionId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">Hủy</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{sIdx + 1}</span>
                      <h3 className="font-bold text-slate-800">{section.title}</h3>
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{section.lessons?.length || 0} bài</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingSectionId(section.id); setEditingSectionTitle(section.title); }} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Sửa</button>
                      <button onClick={() => handleDeleteSection(section.id)} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">Xóa</button>
                    </div>
                  </>
                )}
              </div>

              <div className="p-3 space-y-2">
                {(section.lessons || []).map((lesson, lIdx) => {
                  const meta = getLessonTypeMeta(lesson);
                  return (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">{lIdx + 1}</div>
                        <img src={meta.icon} alt={meta.label} className="w-8 h-8 rounded-md border border-slate-200 bg-white p-1" />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-800 text-sm truncate">{lesson.title}</h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.badgeClass}`}>{meta.label}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Xóa</button>
                    </div>
                  );
                })}

                {addingLessonToSection === section.id ? (
                  <form onSubmit={(e) => handleAddLesson(e, section.id)} className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                    <input type="text" placeholder="Tiêu đề bài giảng" value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" required />
                    <input type="text" placeholder="URL video hoặc tài liệu" value={newLesson.content_url} onChange={(e) => setNewLesson({ ...newLesson, content_url: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    <textarea placeholder="Nội dung văn bản" value={newLesson.content_text} onChange={(e) => setNewLesson({ ...newLesson, content_text: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows="3" />
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">+ Thêm bài giảng</button>
                      <button type="button" onClick={() => { setAddingLessonToSection(null); setNewLesson({ title: "", content_url: "", content_text: "" }); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">Hủy</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setAddingLessonToSection(section.id)} className="w-full text-left p-3 text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-bold border border-dashed border-blue-200">+ Thêm bài giảng vào &ldquo;{section.title}&rdquo;</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddSection} className="flex gap-3">
          <input type="text" placeholder="Tên phần mới" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} className="flex-1 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl" required />
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">+ Thêm Phần Mới</button>
        </form>
      </div>

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
  );
};

export default TeacherCourseDetail;
