import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import CheckoutModal from "../../components/CheckoutModal";
import { courseService, enrollmentService } from "../../services";
import useAsyncData from "../../hooks/useAsyncData";
import { ErrorState, LoadingState } from "../../components/ui";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [expandedSections, setExpandedSections] = useState({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const { data: course, loading, error, retry } = useAsyncData(async () => {
    const courseRes = await courseService.getCourseById(id);
    return courseRes?.data || null;
  }, [id]);

  useEffect(() => {
    if (!course?.sections?.length) return;
    setExpandedSections({ [course.sections[0].id]: true });
  }, [course]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !course) return;

      if (user.role === "student") {
        try {
          const enrollmentRes = await enrollmentService.checkEnrollment(id);
          setIsEnrolled(Boolean(enrollmentRes?.data?.isEnrolled ?? enrollmentRes?.data));
        } catch {
          setIsEnrolled(false);
        }
        return;
      }

      if (["admin", "instructor", "teacher"].includes(user.role)) {
        setCanManage(true);
      }
    };

    checkAccess();
  }, [course, id, user]);

  const handleEnrollClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsCheckoutOpen(true);
  };

  const sections = useMemo(() => course?.sections || [], [course]);
  const totalLessons = useMemo(() => {
    return sections.reduce((sum, section) => sum + (section.lessons?.length || 0), 0);
  }, [sections]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  if (loading) {
    return <LoadingState label="Đang tải chi tiết khóa học..." fullHeight />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={retry} />;
  }

  if (!course) {
    return <ErrorState title="Không tìm thấy khóa học" message="Dữ liệu khóa học không tồn tại hoặc đã bị xóa." onRetry={retry} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
      <div
        className={`bg-gradient-to-r ${course.type === "live" ? "from-purple-600 to-indigo-700" : "from-blue-600 to-cyan-600"} rounded-3xl p-8 lg:p-12 mb-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center`}
      >
        <div className="relative z-10 flex-1">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-4 inline-block shadow-sm">
            {course.type === "live" ? "Lớp Trực Tuyến" : "Khóa Học Video"}
          </span>
          <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight drop-shadow-md">{course.title}</h1>
          <p className="text-white/90 leading-relaxed text-lg max-w-2xl font-medium mb-8">
            {course.description || "Hãy trải nghiệm lớp học bản quyền chất lượng cao với giảng viên hàng đầu."}
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            {isEnrolled ? (
              <Link to={`/course/${id}/learn`} className="bg-white text-slate-900 font-bold px-8 py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-lg">
                {course.type === "live" ? "Xem lịch học Live" : "Tiếp tục học"}
              </Link>
            ) : canManage ? (
              <Link to={`/course/${id}/learn`} className="bg-white/20 backdrop-blur-md text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/30 transition-all border border-white/20">
                Xem trước nội dung
              </Link>
            ) : (
              <button onClick={handleEnrollClick} className="bg-white text-slate-900 font-black px-10 py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-lg">
                ĐĂNG KÝ HỌC NGAY
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3">
              Nội Dung Khóa Học
              <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {sections.length} phần · {totalLessons} bài
              </span>
            </h2>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {sections.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-50/50">Nội dung đang được cập nhật...</div>
              ) : (
                sections.map((section, sIdx) => (
                  <div key={section.id} className="border-b border-slate-100 last:border-0">
                    <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-blue-50 text-blue-600">{sIdx + 1}</span>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">{section.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{section.lessons?.length || 0} bài</p>
                        </div>
                      </div>
                      <span className="text-slate-400 text-lg" style={{ transform: expandedSections[section.id] ? "rotate(180deg)" : "rotate(0deg)" }}>
                        ▼
                      </span>
                    </button>

                    {expandedSections[section.id] && (
                      <div className="px-5 pb-4 space-y-1">
                        {(section.lessons || []).map((lesson, lIdx) => (
                          <div key={lesson.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs flex-shrink-0">{lIdx + 1}</div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-slate-700">{lesson.title}</h4>
                            </div>
                            {isEnrolled && (
                              <Link to={`/course/${id}/learn`} className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition">
                                Xem
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h3 className="text-lg font-black text-slate-800 mb-6">Thông Tin Thêm</h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Giảng viên</p>
                <p className="font-bold text-slate-800">{course.instructor_name || "Giảng viên"}</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Nội Dung Khóa Học</h2>
                <span className="text-sm text-slate-400 font-medium">{sections.length} phần · {totalLessons} bài</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal course={course} isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </div>
  );
};

export default CourseDetail;

