import React, { useState } from "react";

const CoursePlayer = ({ course, onBack }) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const lessons = course?.lessons || [];
  const currentLesson = lessons[currentLessonIndex];

  if (!course) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white">
            ← Back
          </button>
          <h2 className="font-bold truncate max-w-md">{course.title}</h2>
        </div>
        <span className="text-sm bg-blue-600 px-3 py-1 rounded-full">
          Lesson {currentLessonIndex + 1}/{lessons.length}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (Video) */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {currentLesson?.videoUrl ? (
            <iframe
              src={currentLesson.videoUrl}
              className="w-full h-full"
              title="Video Player"
              frameBorder="0"
              allowFullScreen
            />
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-6xl mb-4">📺</p>
              <p>Chọn bài học để bắt đầu</p>
            </div>
          )}
        </div>

        {/* Sidebar Playlist */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-200 font-bold text-gray-700">
            Nội dung khóa học
          </div>
          <div className="flex-1">
            {lessons.map((lesson, index) => (
              <div
                key={index}
                onClick={() => setCurrentLessonIndex(index)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition flex gap-3 ${
                  index === currentLessonIndex
                    ? "bg-blue-100 border-l-4 border-blue-600"
                    : ""
                }`}
              >
                <div className="text-gray-400 font-bold">{index + 1}.</div>
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      index === currentLessonIndex
                        ? "text-blue-800"
                        : "text-gray-700"
                    }`}
                  >
                    {lesson.title}
                  </h4>
                  <span className="text-xs text-gray-400">10:00 mins</span>
                </div>
                {lesson.isLocked && <span className="ml-auto text-xs">🔒</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
