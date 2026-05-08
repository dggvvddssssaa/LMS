import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IMAGES, getBackgroundByIndex } from "../../constants/images";
import useAsyncData from "../../hooks/useAsyncData";
import { courseService } from "../../services";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";

const CourseList = () => {
  const [filter, setFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  const { data, loading, error, retry } = useAsyncData(async () => {
    const [coursesRes, categoriesRes] = await Promise.all([
      courseService.getPublishedCourses(),
      courseService.getCategories().catch(() => ({ success: true, data: [] })),
    ]);

    return {
      courses: coursesRes?.data || [],
      categories: categoriesRes?.data || [],
    };
  }, []);

  const courses = data?.courses || [];
  const categories = data?.categories || [];

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % Object.keys(IMAGES.backgrounds).length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchType = filter === "all" || course.type === filter;
      const matchCategory =
        selectedCategory === "all" ||
        (course.categories && course.categories.some((cat) => cat.id === parseInt(selectedCategory, 10)));
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (course.title && course.title.toLowerCase().includes(q)) ||
        (course.description && course.description.toLowerCase().includes(q));

      return matchType && matchCategory && matchSearch;
    });
  }, [courses, filter, selectedCategory, searchQuery]);

  if (loading) {
    return <LoadingState label="Đang tải khóa học..." fullHeight />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={retry} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0 transition-all duration-1000" style={{ background: getBackgroundByIndex(backgroundIndex) }} />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/70 to-indigo-900/80" />
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight animate-fade-in">Khám Phá Thế Giới Học Tập</h1>
            <p className="text-xl md:text-2xl mb-8 leading-relaxed opacity-90">
              Học mọi lúc, mọi nơi với các khóa học chất lượng từ chuyên gia hàng đầu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#courses-listing" className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg inline-block text-center">
                Bắt Đầu Học Tập
              </a>
              <Link to="/register" className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-blue-900 transition-all inline-block text-center">
                Tìm Hiểu Thêm
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div id="courses-listing" className="py-16 px-4 bg-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Khóa Học Nổi Bật</h2>
              <p className="text-slate-500 mt-2 max-w-xl">Khám phá các khóa học được yêu thích nhất từ cộng đồng học viên.</p>
            </div>

            <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-inner">
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                className="px-4 py-2 border-none focus:outline-none bg-transparent w-full text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-inner text-sm font-bold text-slate-600 focus:outline-none"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-inner">
              {[
                { key: "all", label: "Tất Cả" },
                { key: "video", label: "Video" },
                { key: "live", label: "Live" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                    filter === item.key ? "bg-blue-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <EmptyState title="Chưa có khóa học phù hợp" description="Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  to={`/course/${course.id}`}
                  key={course.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={course.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <span className="text-6xl">{course.type === "live" ? "🔴" : "📹"}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight min-h-[48px]">
                      {course.title}
                    </h3>
                    <div className="text-xs text-slate-500 mb-4 font-medium">{course.instructor_name || "Hệ thống"}</div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <div>
                        {parseFloat(course.sale_price) > 0 ? (
                          <>
                            <span className="text-xs text-slate-400 line-through">{parseFloat(course.price).toLocaleString()} đ</span>
                            <span className="block font-black text-red-600 text-lg">{parseFloat(course.sale_price).toLocaleString()} đ</span>
                          </>
                        ) : (
                          <span className="font-black text-blue-600 text-lg">
                            {parseFloat(course.price) === 0 ? "Miễn phí" : `${parseFloat(course.price).toLocaleString()} đ`}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Chi tiết →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseList;

