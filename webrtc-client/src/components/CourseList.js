import React from "react";

const CourseList = ({ courses, onJoinCourse }) => {
  if (!courses || courses.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10">
        Chưa có khóa học nào.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border border-gray-100 flex flex-col"
        >
          {/* Thumbnail giả lập bằng CSS Gradient */}
          <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
            <span className="text-white font-bold text-3xl opacity-30">
              COURSE
            </span>
            <div className="absolute top-2 right-2 bg-black/30 px-2 py-1 rounded text-xs text-white">
              {course.lessons?.length || 0} Lessons
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {course.category || "General"}
              </span>
              <span className="text-sm font-bold text-green-600">
                {course.price === 0 ? "FREE" : `$${course.price}`}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
              {course.title}
            </h3>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                {course.teacher?.name?.charAt(0) || "T"}
              </div>
              <span className="text-sm text-gray-500">
                {course.teacher?.name || "Unknown Teacher"}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-6 line-clamp-3 flex-1">
              {course.description ||
                "Mô tả khóa học ngắn gọn để học viên nắm bắt nội dung chính."}
            </p>

            <button
              onClick={() => onJoinCourse(course.id)}
              className="w-full bg-gray-900 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              🚀 Vào Lớp Học
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseList;
