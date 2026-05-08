import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';
import LessonCard from './components/CourseEditor/LessonCard';
import LiveClassSchedule from './components/CourseEditor/LiveClassSchedule';
import { useToast } from '../../contexts/ToastContext';

function useAutoSave(saveFn, delay = 1000) {
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);
  const trigger = useCallback((data) => {
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { await saveFn(data); setStatus('saved'); setTimeout(() => setStatus('idle'), 2000); }
      catch { setStatus('idle'); }
    }, delay);
  }, [saveFn, delay]);
  return { trigger, status };
}



export default function CourseEditor() {
  const { id } = useParams();
  const { pushToast } = useToast();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatUrl, setNewMatUrl] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    Promise.all([
      httpClient.get(`/courses/${id}`),
      httpClient.get(`/materials/${id}`).catch(() => ({ data: { data: [] } }))
    ]).then(([courseRes, matRes]) => {
      if (courseRes.data.success) {
        setCourse(courseRes.data.data);
        setSections(courseRes.data.data.sections || []);
      }
      setMaterials(matRes.data?.data || []);
    }).catch(err => console.error('Failed to load course:', err)).finally(() => setLoading(false));
  }, [id]);

  const { trigger: autoSaveCourse, status: saveStatus } = useAutoSave(
    useCallback(async (data) => { await httpClient.put(`/courses/${id}`, data); }, [id])
  );
  const updateField = (field, value) => { setCourse(prev => ({ ...prev, [field]: value })); autoSaveCourse({ [field]: value }); };

  const addSection = async () => {
    try {
      const res = await httpClient.post('/sections', { course_id: Number(id), title: 'Phần mới' });
      if (res.data.success) setSections(prev => [...prev, { ...res.data.data, lessons: [] }]);
    } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể tạo phần học' }); }
  };
  const updateSection = async (sid, title) => {
    try { await httpClient.put(`/sections/${sid}`, { title }); setSections(prev => prev.map(s => s.id === sid ? { ...s, title } : s)); } catch(e) { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể cập nhật phần học' }); }
  };
  const deleteSection = async (sid) => {
    if (!confirm('Xóa phần này và tất cả bài học bên trong?')) return;
    try { await httpClient.delete(`/sections/${sid}`); setSections(prev => prev.filter(s => s.id !== sid)); } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa phần học' }); }
  };
  const addLesson = async (sectionId) => {
    try {
      const res = await httpClient.post('/lessons', { section_id: sectionId, title: 'Bài học mới', content_type: 'video' });
      if (res.data.success) setSections(prev => prev.map(s => s.id === sectionId ? { ...s, lessons: [...(s.lessons || []), res.data.data] } : s));
    } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể tạo bài học' }); }
  };
  const updateLesson = async (lessonId, data) => {
    try {
      await httpClient.put(`/lessons/${lessonId}`, data);
      setSections(prev => prev.map(s => ({ ...s, lessons: (s.lessons || []).map(l => l.id === lessonId ? { ...l, ...data } : l) })));
    } catch(e) { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể cập nhật bài học' }); }
  };
  const deleteLesson = async (lessonId, sectionId) => {
    if (!confirm('Xóa bài học này?')) return;
    try { await httpClient.delete(`/lessons/${lessonId}`); setSections(prev => prev.map(s => s.id === sectionId ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) } : s)); } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa bài học' }); }
  };
  
  const reorderLessons = async (sectionId, fromIndex, toIndex) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const newLessons = [...(s.lessons || [])];
      const [moved] = newLessons.splice(fromIndex, 1);
      newLessons.splice(toIndex, 0, moved);
      // Cập nhật lại order_index cho chuẩn
      const updatedLessons = newLessons.map((l, idx) => ({ ...l, order_index: idx }));
      
      // Gửi API update ngầm
      httpClient.put('/lessons/reorder', updatedLessons.map(l => ({ id: l.id, order_index: l.order_index })))
        .catch(() => {
           pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể lưu thứ tự bài học, vui lòng thử lại.' });
        });
        
      return { ...s, lessons: updatedLessons };
    }));
  };
  const addMaterial = async () => {
    if (!newMatTitle || !newMatUrl) return;
    try {
      const res = await httpClient.post('/materials', { course_id: Number(id), title: newMatTitle, file_url: newMatUrl });
      if (res.data.success) { setMaterials(prev => [res.data.data, ...prev]); setNewMatTitle(''); setNewMatUrl(''); }
    } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể thêm tài liệu' }); }
  };
  const deleteMaterial = async (mid) => {
    try { await httpClient.delete(`/materials/${mid}`); setMaterials(prev => prev.filter(m => m.id !== mid)); } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa tài liệu' }); }
  };
  const publish = async () => {
    try {
      await httpClient.put(`/courses/${id}/publish`);
      setCourse(prev => ({ ...prev, status: 'published', is_published: true }));
      setSaveMsg('Đã xuất bản!'); setTimeout(() => setSaveMsg(''), 3000);
    } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể xuất bản khóa học' }); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" /><span className="ml-3 font-semibold text-slate-500">Đang tải...</span></div>;
  if (!course) return <div className="p-10 text-center text-slate-500">Không tìm thấy khóa học</div>;

  const statusText = saveStatus === 'saving' ? '💾 Đang lưu...' : saveStatus === 'saved' ? '✅ Đã lưu' : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" ref={menuRef}>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-none md:rounded-b-[2.5rem] px-4 pt-6 pb-10 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/courses-editor" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition text-lg">←</Link>
              <div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-2 inline-block">Chỉnh sửa khóa học</span>
                <h1 className="text-3xl font-black tracking-tight drop-shadow-md">{course.title || 'Khóa học mới'}</h1>
                <p className="text-white/70 text-sm mt-1 font-medium">{statusText || 'Tất cả thay đổi được lưu tự động'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveMsg && <span className="text-white font-bold text-sm bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg">{saveMsg}</span>}
              <button onClick={publish} className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg ${course.is_published ? 'bg-white/20 backdrop-blur-md text-white border border-white/20' : 'bg-white text-blue-700 hover:bg-slate-50 shadow-white/20'}`}>
                {course.is_published ? '✅ Đã xuất bản' : '🚀 Xuất bản'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-5xl px-4 animate-fade-in">

      {/* Course Info */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">📝 Thông tin khóa học</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tên khóa học</label>
            <input value={course.title || ''} onChange={e => updateField('title', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Mô tả</label>
            <textarea value={course.description || ''} onChange={e => updateField('description', e.target.value)} rows="3" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Thumbnail URL</label>
              <input value={course.thumbnail || ''} onChange={e => updateField('thumbnail', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Loại khóa học</label>
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button onClick={() => updateField('type', 'video')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${course.type !== 'live' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>📹 Video</button>
                <button onClick={() => updateField('type', 'live')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${course.type === 'live' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}>🔴 Live</button>
              </div>
            </div>
          </div>
          {course.thumbnail && <img src={course.thumbnail} alt="" className="h-32 rounded-xl object-cover border border-slate-200" />}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">💰 Giá và cấu hình</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-semibold text-slate-600 mb-1.5">Giá gốc (VNĐ)</label><input type="number" value={course.price || 0} onChange={e => updateField('price', Number(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold" /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1.5">Giá Sale (VNĐ)</label><input type="number" value={course.sale_price || 0} onChange={e => updateField('sale_price', Number(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-red-600" /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1.5">Level</label>
            <select value={course.level || 'beginner'} onChange={e => updateField('level', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm">
              <option value="beginner">Cơ bản</option><option value="intermediate">Trung cấp</option><option value="advanced">Nâng cao</option>
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1.5">Loại khóa học</label>
            <select value={course.type || 'recorded'} onChange={e => updateField('type', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-blue-600">
              <option value="recorded">Khóa học Video</option>
              <option value="live">Lớp học Trực tiếp</option>
              <option value="hybrid">Hỗn hợp (Video + Live)</option>
            </select>
          </div>
        </div>
      </div>

      {/* LiveClassSchedule */}
      {(course.type === 'live' || course.type === 'hybrid') && (
        <div className="mb-6">
          <LiveClassSchedule courseId={course.id} />
        </div>
      )}

      {/* Sections & Lessons */}
      {(course.type === 'recorded' || course.type === 'hybrid' || !course.type) && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">📚 Nội dung khóa học <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">{sections.length} phần</span></h2>
            <button onClick={addSection} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-100">+ Thêm phần học</button>
          </div>
        {sections.length === 0 && <div className="text-center py-12 text-slate-400"><span className="text-4xl block mb-3">📂</span>Chưa có phần học nào</div>}
        <div className="space-y-4">
          {sections.map((section, sIdx) => (
            <div key={section.id} className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">{sIdx + 1}</span>
                  {editingSection === section.id ? (
                    <input autoFocus value={section.title} onChange={e => setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))} onBlur={e => { updateSection(section.id, e.target.value); setEditingSection(null); }} onKeyDown={e => { if (e.key === 'Enter') { updateSection(section.id, e.target.value); setEditingSection(null); }}} className="flex-1 px-3 py-1.5 border border-blue-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  ) : <h3 className="font-bold text-slate-800">{section.title}</h3>}
                  <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{(section.lessons || []).length} bài</span>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenu(openMenu === 's'+section.id ? null : 's'+section.id)} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-500 transition text-lg">⋮</button>
                  {openMenu === 's'+section.id && (
                    <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1 animate-fade-in">
                      <button onClick={() => { setEditingSection(section.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">✏️ Đổi tên</button>
                      <button onClick={() => { addLesson(section.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50">➕ Thêm bài học</button>
                      <button onClick={() => { deleteSection(section.id); setOpenMenu(null); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">🗑️ Xóa phần này</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {(section.lessons || []).map((lesson, lIdx) => (
                  <LessonCard 
                    key={lesson.id}
                    lesson={lesson}
                    index={lIdx}
                    isFirst={lIdx === 0}
                    isLast={lIdx === (section.lessons || []).length - 1}
                    onUpdate={updateLesson}
                    onDelete={(lId) => deleteLesson(lId, section.id)}
                    onMoveUp={(idx) => reorderLessons(section.id, idx, idx - 1)}
                    onMoveDown={(idx) => reorderLessons(section.id, idx, idx + 1)}
                  />
                ))}
                {(section.lessons || []).length === 0 && <div className="p-6 text-center text-slate-400 text-sm">Chưa có bài học nào</div>}
              </div>
              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                <button onClick={() => addLesson(section.id)} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition">+ Thêm bài học vào phần này</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Materials */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 mb-10 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">📎 Tài liệu học tập</h2>
        <div className="space-y-3 mb-4">
          {materials.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xl">📄</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-800 truncate">{m.title}</div>
                <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 truncate block hover:underline">{m.file_url}</a>
              </div>
              <button onClick={() => deleteMaterial(m.id)} className="text-red-400 hover:text-red-600 text-sm font-bold px-2">✕</button>
            </div>
          ))}
          {materials.length === 0 && <div className="text-center py-6 text-slate-400 text-sm">Chưa có tài liệu nào</div>}
        </div>
        <div className="flex gap-2">
          <input value={newMatTitle} onChange={e => setNewMatTitle(e.target.value)} placeholder="Tên tài liệu" className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          <input value={newMatUrl} onChange={e => setNewMatUrl(e.target.value)} placeholder="Link tải về" className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          <button onClick={addMaterial} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">Thêm</button>
        </div>
      </div>
      </div>{/* close container */}
    </div>
  );
}

