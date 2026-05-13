import React, { useState, useRef, useEffect } from 'react';
import AssignmentBuilder from './AssignmentBuilder';

function LessonEditForm({ lesson, onSave, onCancel }) {
  const [title, setTitle] = useState(lesson.title || '');
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || lesson.content_url || '');
  const [desc, setDesc] = useState(lesson.description || lesson.content_text || '');
  const [duration, setDuration] = useState(lesson.duration || 0);
  const [contentType, setContentType] = useState(lesson.content_type || 'video');
  const [isFreePreview, setIsFreePreview] = useState(lesson.is_free_preview || false);
  
  return (
    <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-4 animate-fade-in shadow-inner">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Tên bài học</label>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="VD: Bài 1: Giới thiệu khóa học" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Loại nội dung</label>
          <select value={contentType} onChange={e => setContentType(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="video">Video</option>
            <option value="document">Tài liệu / Bài đọc</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Link Video (Tùy chọn)</label>
        <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="https://youtube.com/embed/..." />
        {videoUrl && <div className="mt-3 bg-black rounded-xl overflow-hidden aspect-video shadow-md"><iframe src={videoUrl} className="w-full h-full" allowFullScreen title="preview" /></div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Thời lượng (phút)</label>
          <input type="number" min="0" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input type="checkbox" id={`free_preview_${lesson.id}`} checked={isFreePreview} onChange={e => setIsFreePreview(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
          <label htmlFor={`free_preview_${lesson.id}`} className="block text-sm font-bold text-slate-800 cursor-pointer">Cho phép xem thử miễn phí</label>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Nội dung / Mô tả</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows="3" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Mô tả nội dung bài học..." />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm">Hủy</button>
        <button onClick={() => onSave({ title, video_url: videoUrl, description: desc, content_text: desc, duration, content_type: contentType, is_free_preview: isFreePreview })} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20">Lưu Thay Đổi</button>
      </div>
    </div>
  );
}

function LessonActionsMenu({ isOpen, onClose, onEdit, onConfigAssignment, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 animate-fade-in origin-top-right">
      <button onClick={onEdit} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
        <span>✏️</span> Chỉnh sửa
      </button>
      {!isFirst && (
        <button onClick={onMoveUp} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
          <span>⬆️</span> Đưa lên
        </button>
      )}
      {!isLast && (
        <button onClick={onMoveDown} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
          <span>⬇️</span> Đưa xuống
        </button>
      )}
      <div className="h-px bg-slate-100 my-1 mx-4" />
      <button onClick={onConfigAssignment} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition flex items-center gap-2">
        <span>📝</span> Bài tập
      </button>
      <div className="h-px bg-slate-100 my-1 mx-4" />
      <button onClick={onDelete} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-2">
        <span>🗑️</span> Xóa bài học
      </button>
    </div>
  );
}

export default function LessonCard({ lesson, index, _sectionId, courseId, isFirst, isLast, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAssignmentBuilder, setShowAssignmentBuilder] = useState(false);

  if (isEditing) {
    return (
      <div className="p-4 md:p-6 border-b border-slate-100 last:border-0 bg-blue-50/20">
        <LessonEditForm 
          lesson={lesson} 
          onSave={(data) => { onUpdate(lesson.id, data); setIsEditing(false); }} 
          onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition group">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl leading-none drop-shadow-sm">{lesson.content_type === 'document' ? '📄' : '🎬'}</span>
            <h4 className="font-bold text-slate-800 text-base">{lesson.title}</h4>
          </div>
          
          {lesson.video_url && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">Video</span>
              <p className="text-xs text-slate-400 truncate max-w-[200px] md:max-w-md">{lesson.video_url}</p>
            </div>
          )}
          
          {(lesson.description || lesson.content_text) && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{lesson.description || lesson.content_text}</p>
          )}
        </div>
        
        <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-700 transition text-xl">
          ⋮
        </button>
        <LessonActionsMenu 
          isOpen={menuOpen} 
          onClose={() => setMenuOpen(false)}
          onEdit={() => { setIsEditing(true); setMenuOpen(false); }}
          onConfigAssignment={() => { setShowAssignmentBuilder(!showAssignmentBuilder); setMenuOpen(false); }}
          onDelete={() => { onDelete(lesson.id); setMenuOpen(false); }}
          onMoveUp={() => { onMoveUp(index); setMenuOpen(false); }}
          onMoveDown={() => { onMoveDown(index); setMenuOpen(false); }}
          isFirst={isFirst}
          isLast={isLast}
        />
      </div>
    </div>
      
      {/* Thêm phần render AssignmentBuilder */}
      {showAssignmentBuilder && (
        <div className="w-full mt-4 pt-4 border-t border-dashed border-slate-200">
          <AssignmentBuilder 
            lessonId={lesson.id} 
            courseId={courseId} 
            onClose={() => setShowAssignmentBuilder(false)} 
          />
        </div>
      )}
    </div>
  );
}
