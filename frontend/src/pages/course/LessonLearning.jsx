import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import CourseQA from "../../components/CourseQA";
import useAsyncData from "../../hooks/useAsyncData";
import { courseService, enrollmentService } from "../../services";
import httpClient from "../../services/core/httpClient";
import { ErrorState, LoadingState } from "../../components/ui";
import AssignmentViewer from "./components/AssignmentViewer";
import { useToast } from "../../contexts/ToastContext";

const LessonLearning = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pushToast } = useToast();

  const [activeLesson, setActiveLesson] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [progressData, setProgressData] = useState({ overallProgress: 0, lessons: {} });
  const [sidebarTab, setSidebarTab] = useState("content");
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);

  const { data, loading, error, retry } = useAsyncData(async () => {
    const courseRes = await courseService.getCourseById(id);
    const course = courseRes?.data;

    let progress = { overallProgress: 0, lessons: {} };
    if (user?.role === "student") {
      try {
        const progressRes = await enrollmentService.getProgress(id);
        progress = progressRes?.data || progress;
      } catch {
        progress = { overallProgress: 0, lessons: {} };
      }
    }

    let liveClass = null;
    let sessions = [];
    if (course?.type === 'live' || course?.type === 'hybrid') {
      try {
        const lcRes = await httpClient.get(`/live-classes/course/${id}`);
        liveClass = lcRes.data.data;
        if (liveClass) {
          const sRes = await httpClient.get(`/sessions/live-class/${liveClass.id}`);
          sessions = sRes.data.data || [];
        }
      } catch (e) {
        console.error("Failed to load live class", e);
      }
    }

    return { course, progress, liveClass, sessions };
  }, [id, user?.role]);

  const course = data?.course || null;
  const sessions = data?.sessions || [];

  // Check if student already has a certificate for this course
  useEffect(() => {
    if (user?.role === 'student' && id) {
      httpClient.get(`/certificates/course/${id}`)
        .then(res => {
          if (res.data.success && res.data.data) {
            setCertificateData(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [user, id]);

  useEffect(() => {
    if (course?.type === 'live' && sessions.length > 0 && !activeSession) {
      // Auto select nearest or first session
      setActiveSession(sessions[0]);
    } else if (course?.sections?.length) {
      const firstSection = course.sections[0];
      setExpandedSections({ [firstSection.id]: true });
      if (firstSection.lessons?.length && !activeLesson) {
        setActiveLesson(firstSection.lessons[0]);
      }
    }
  }, [course, sessions]);

  useEffect(() => {
    if (data?.progress) {
      setProgressData(data.progress);
    }
  }, [data]);

  const sections = useMemo(() => course?.sections || [], [course]);
  const totalLessons = useMemo(() => sections.reduce((sum, section) => sum + (section.lessons?.length || 0), 0), [sections]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleMarkComplete = async (isCompleted = true) => {
    if (!user || user.role !== "student" || !activeLesson) return;

    try {
      setIsMarkingComplete(true);
      const res = await enrollmentService.markLessonComplete({
        courseId: id,
        lessonId: activeLesson.id,
        isCompleted,
      });

      const progress = res?.data?.courseProgress?.progressPercent || progressData.overallProgress;
      setProgressData((prev) => ({
        ...prev,
        overallProgress: progress,
        lessons: {
          ...prev.lessons,
          [activeLesson.id]: {
            ...(prev.lessons[activeLesson.id] || {}),
            isCompleted,
          },
        },
      }));
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleGenerateCertificate = async () => {
    setIsGeneratingCert(true);
    try {
      const res = await httpClient.post(`/certificates/generate/${id}`);
      if (res.data.success) {
        setCertificateData(res.data.data);
        navigate(`/certificate/${res.data.data.id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi tạo chứng chỉ';
      pushToast({ type: 'error', title: 'Lỗi tạo chứng chỉ', message: msg });
    } finally {
      setIsGeneratingCert(false);
    }
  };

  const renderContent = () => {
    if ((course?.type === "live" || course?.type === "hybrid") && activeSession) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-slate-800 text-white">
          <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-4xl mb-6">🎥</div>
          <h2 className="text-3xl font-black mb-2 text-center">{activeSession.title}</h2>
          <div className="flex items-center gap-2 text-slate-300 mb-8">
            <span className="bg-slate-800 px-3 py-1 rounded-lg text-sm font-bold border border-slate-700">Bắt đầu: {new Date(activeSession.start_time).toLocaleString('vi-VN')}</span>
          </div>
          <button
            onClick={() => navigate(`/session/${activeSession.meeting_id}/join`)}
            className="px-8 py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-3 text-lg"
          >
            <span>👉</span> Tham Gia Lớp Học
          </button>
        </div>
      );
    }

    if (!activeLesson) {
      if (course?.type === "live" && !activeSession) {
        return <div className="h-full flex items-center justify-center text-slate-400 text-lg">Chưa có lịch học nào.</div>;
      }
      return <div className="h-full flex items-center justify-center text-slate-400 text-lg">Chọn một bài giảng để bắt đầu.</div>;
    }

    if (activeLesson.content_type === "video") {
      const url = activeLesson.content_url || "";
      if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("embed")) {
        const embedUrl = url.includes("watch?v=") ? url.replace("watch?v=", "embed/") : url;
        return (
          <iframe
            className="w-full h-full rounded-2xl"
            src={embedUrl}
            title="Video Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
      return <video className="w-full h-full object-contain rounded-2xl bg-black" controls src={url} />;
    }

    if (activeLesson.content_type === "document") {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50 rounded-2xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-2">{activeLesson.title}</h2>
          {activeLesson.content_url ? (
            <a href={activeLesson.content_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700">
              Mở tài liệu
            </a>
          ) : (
            <p className="text-slate-400">Chưa có liên kết tài liệu.</p>
          )}
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto p-6 md:p-8 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{activeLesson.title}</h2>
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{activeLesson.content_text || "Nội dung đang được cập nhật..."}</div>
      </div>
    );
  };

  if (loading) {
    return <LoadingState label="Đang tải môi trường học..." fullHeight />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={retry} />;
  }

  if (!course) {
    return <ErrorState title="Không tìm thấy khóa học" message="Khóa học không tồn tại." onRetry={retry} />;
  }

  const progressPercent = progressData.overallProgress || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/course/${id}`} className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
              &larr;
            </Link>
            <h1 className="font-bold text-slate-800 truncate">{course.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-500">{progressPercent}%</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 min-h-[65vh] flex flex-col">
            <div className="flex-1 min-h-[380px]">{renderContent()}</div>
            
            {/* Nơi hiển thị Bài tập */}
            {activeLesson && course?.type !== "live" && user?.role === "student" && (
              <AssignmentViewer lessonId={activeLesson.id} />
            )}

            {activeLesson && course?.type !== "live" && user?.role === "student" && (
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">{activeLesson.title}</h2>
                <button
                  onClick={() => handleMarkComplete(!progressData.lessons[activeLesson.id]?.isCompleted)}
                  disabled={isMarkingComplete}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    progressData.lessons[activeLesson.id]?.isCompleted
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isMarkingComplete ? "Đang lưu..." : progressData.lessons[activeLesson.id]?.isCompleted ? "Đã hoàn thành" : "Hoàn thành bài học"}
                </button>
              </div>
            )}
          </div>

          <aside className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-fit flex flex-col max-h-[80vh]">
            {/* Certificate Banner */}
            {user?.role === 'student' && progressPercent >= 100 && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
                {certificateData ? (
                  <Link
                    to={`/certificate/${certificateData.id}`}
                    className="flex items-center gap-3 p-3 bg-white border border-amber-200 rounded-xl hover:shadow-md transition-all group"
                  >
                    <span className="text-3xl">🏅</span>
                    <div>
                      <p className="font-bold text-amber-800 text-sm group-hover:text-amber-900">Chứng Chỉ Đã Cấp!</p>
                      <p className="text-xs text-amber-600">Nhấn để xem chứng chỉ của bạn</p>
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={handleGenerateCertificate}
                    disabled={isGeneratingCert}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md shadow-amber-500/30 disabled:opacity-60"
                  >
                    <span className="text-3xl">🎓</span>
                    <div className="text-left">
                      <p className="font-bold text-sm">{isGeneratingCert ? 'Đang tạo...' : 'Nhận Chứng Chỉ!'}</p>
                      <p className="text-xs text-amber-100">Bạn đã hoàn thành 100% khóa học</p>
                    </div>
                  </button>
                )}
              </div>
            )}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setSidebarTab("content")}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${sidebarTab === "content" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"}`}
              >
                Nội dung bài học
              </button>
              <button
                onClick={() => setSidebarTab("qa")}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${sidebarTab === "qa" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"}`}
              >
                Hỏi Đáp
              </button>
            </div>

            {sidebarTab === "content" ? (
              <div className="flex-1 overflow-y-auto">
                {(course?.type === 'recorded' || course?.type === 'hybrid' || !course?.type) && (
                  <>
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {sections.length} phần · {totalLessons} bài
                    </div>
                    {sections.map((section, sIdx) => (
                  <div key={section.id} className="border-b border-slate-100 last:border-b-0">
                    <button onClick={() => toggleSection(section.id)} className="w-full text-left p-4 hover:bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">{sIdx + 1}</span>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800">{section.title}</h4>
                          <span className="text-[10px] text-slate-500">{section.lessons?.length || 0} bài</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{expandedSections[section.id] ? "?" : "?"}</span>
                    </button>

                    {expandedSections[section.id] && (
                      <div className="px-2 pb-2">
                        {(section.lessons || []).map((lesson, lIdx) => {
                          const isActive = activeLesson?.id === lesson.id;
                          const isCompleted = progressData.lessons[lesson.id]?.isCompleted;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => { setActiveLesson(lesson); setActiveSession(null); }}
                              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all mb-1 ${
                                isActive ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                  isActive ? "bg-blue-600 text-white" : isCompleted ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {isActive ? "?" : isCompleted ? "?" : lIdx + 1}
                              </div>
                              <h5 className={`text-sm truncate ${isActive ? "font-bold text-slate-800" : "text-slate-700"}`}>{lesson.title}</h5>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                </>
                )}

                {(course?.type === 'live' || course?.type === 'hybrid') && sessions.length > 0 && (
                  <>
                    <div className="p-4 border-b border-slate-100 bg-blue-50/50 text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Lịch Học Trực Tiếp ({sessions.length} buổi)
                    </div>
                    <div className="divide-y divide-slate-100">
                      {sessions.map((session, idx) => {
                        const isActive = activeSession?.id === session.id;
                        return (
                          <button
                            key={session.id}
                            onClick={() => { setActiveSession(session); setActiveLesson(null); }}
                            className={`w-full text-left p-4 hover:bg-slate-50 flex items-start gap-3 transition-colors ${isActive ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</div>
                            <div>
                              <h4 className={`font-semibold text-sm ${isActive ? 'text-blue-800' : 'text-slate-800'}`}>{session.title}</h4>
                              <p className="text-xs text-slate-500 mt-1">{new Date(session.start_time).toLocaleString('vi-VN')}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {session.status === 'scheduled' ? 'Sắp diễn ra' : session.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <CourseQA courseId={id} activeLessonId={activeLesson?.id} />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LessonLearning;


