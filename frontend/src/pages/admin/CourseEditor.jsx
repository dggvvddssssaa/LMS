import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';
import LessonCard from './components/CourseEditor/LessonCard';
import LiveClassSchedule from './components/CourseEditor/LiveClassSchedule';
import AssignmentBuilder from './components/CourseEditor/AssignmentBuilder';
import { useToast } from '../../contexts/ToastContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function SortableSection({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `section-${id}`, data: { type: 'Section', section: id } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : 1,
  };
  return <div ref={setNodeRef} style={style}>{children(attributes, listeners)}</div>;
}

function SortableLesson({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `lesson-${id}`, data: { type: 'Lesson', lesson: id } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : 1,
  };
  return <div ref={setNodeRef} style={style}>{children(attributes, listeners)}</div>;
}

export default function CourseEditor() {
  const { id } = useParams();
  const { pushToast } = useToast();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatUrl, setNewMatUrl] = useState('');
  const [showFinalAssignment, setShowFinalAssignment] = useState(false);
  const [autoSyncSlug, setAutoSyncSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState({ loading: false, valid: null, msg: '' });
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    // Drag section
    if (activeId.startsWith('section-') && overId.startsWith('section-')) {
      const activeSectionId = Number(activeId.replace('section-', ''));
      const overSectionId = Number(overId.replace('section-', ''));

      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === activeSectionId);
        const newIndex = items.findIndex(i => i.id === overSectionId);
        const newSections = arrayMove(items, oldIndex, newIndex);
        
        const updatedSections = newSections.map((s, idx) => ({ ...s, order_index: idx }));
        
        httpClient.put('/sections/reorder', updatedSections.map(s => ({ id: s.id, order_index: s.order_index })))
          .catch(() => pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể lưu thứ tự phần học' }));

        return updatedSections;
      });
      return;
    }

    // Drag lesson
    if (activeId.startsWith('lesson-')) {
      let activeSectionId = null;
      let overSectionId = null;
      const activeLessonIdNum = Number(activeId.replace('lesson-', ''));
      const isOverSection = overId.startsWith('section-');
      const overLessonIdNum = !isOverSection ? Number(overId.replace('lesson-', '')) : null;

      sections.forEach(s => {
         if ((s.lessons || []).find(l => l.id === activeLessonIdNum)) activeSectionId = s.id;
         if (isOverSection && s.id === Number(overId.replace('section-', ''))) overSectionId = s.id;
         if (!isOverSection && (s.lessons || []).find(l => l.id === overLessonIdNum)) overSectionId = s.id;
      });

      if (activeSectionId && overSectionId) {
        setSections(prev => {
          const newSections = JSON.parse(JSON.stringify(prev));
          const sourceSec = newSections.find(s => s.id === activeSectionId);
          const targetSec = newSections.find(s => s.id === overSectionId);
          
          const activeIndex = sourceSec.lessons.findIndex(l => l.id === activeLessonIdNum);
          const [movedLesson] = sourceSec.lessons.splice(activeIndex, 1);
          
          let overIndex = targetSec.lessons.length;
          if (!isOverSection) {
             overIndex = targetSec.lessons.findIndex(l => l.id === overLessonIdNum);
             if (overIndex === -1) overIndex = targetSec.lessons.length;
          }
          
          targetSec.lessons.splice(overIndex, 0, movedLesson);
          
          const sourceUpdates = sourceSec.lessons.map((l, idx) => ({ id: l.id, order_index: idx, section_id: sourceSec.id }));
          const targetUpdates = activeSectionId !== overSectionId ? targetSec.lessons.map((l, idx) => ({ id: l.id, order_index: idx, section_id: targetSec.id })) : [];
          
          httpClient.put('/lessons/reorder', [...sourceUpdates, ...targetUpdates])
            .catch(() => pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể lưu thứ tự bài học' }));
            
          return newSections;
        });
      }
    }
  };

  useEffect(() => {
    Promise.all([
      httpClient.get(`/admin/courses/${id}`),
      httpClient.get(`/materials/${id}`).catch(() => ({ data: { data: [] } })),
      httpClient.get('/categories').catch(() => ({ data: { data: [] } })),
      httpClient.get('/certificate-templates').catch(() => ({ data: { data: [] } }))
    ]).then(([courseRes, matRes, catRes, tplRes]) => {
      if (courseRes.data.success) {
        const data = courseRes.data.data;
        if (data.type === 'video') data.type = 'recorded';
        setCourse(data);
        setSections(data.sections || []);
      }
      setMaterials(matRes.data?.data || []);
      setCategories(catRes.data?.data || []);
      setTemplates(tplRes.data?.data || []);
    }).catch(err => {
      console.error('Failed to load course:', err);
      const status = err.response?.status;
      if (status === 401) {
        pushToast({ type: 'error', title: 'Phiên đăng nhập hết hạn', message: 'Vui lòng đăng nhập lại.' });
      } else if (status === 403) {
        pushToast({ type: 'error', title: 'Không có quyền', message: 'Bạn không có quyền truy cập khóa học này.' });
      } else {
        pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể tải khóa học.' });
      }
    }).finally(() => setLoading(false));
  }, [id, pushToast]);

  useEffect(() => {
    if (!course || !course.slug) return;
    const timer = setTimeout(async () => {
      setSlugStatus({ loading: true, valid: null, msg: '' });
      try {
        const res = await httpClient.get(`/admin/courses/slug/check?slug=${course.slug}&excludeId=${id}`);
        if (res.data.isAvailable) {
          setSlugStatus({ loading: false, valid: true, msg: 'Slug hợp lệ' });
        } else {
          setSlugStatus({ loading: false, valid: false, msg: 'Slug đã tồn tại' });
        }
      } catch (err) {
        setSlugStatus({ loading: false, valid: false, msg: 'Lỗi kiểm tra' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [course?.slug, id]);

  const { trigger: autoSaveCourse, status: saveStatus } = useAutoSave(
    useCallback(async (data) => { await httpClient.put(`/admin/courses/${id}`, data); }, [id])
  );
  const updateField = (field, value) => { setCourse(prev => ({ ...prev, [field]: value })); autoSaveCourse({ [field]: value }); };

  const addSection = async () => {
    try {
      const res = await httpClient.post('/sections', { course_id: Number(id), title: 'Phần mới' });
      if (res.data.success) setSections(prev => [...prev, { ...res.data.data, lessons: [] }]);
    } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể tạo phần học' }); }
  };
  const updateSection = async (sid, title) => {
    try { await httpClient.put(`/sections/${sid}`, { title }); setSections(prev => prev.map(s => s.id === sid ? { ...s, title } : s)); } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể cập nhật phần học' }); }
  };
  const deleteSection = async (sid) => {
    if (!confirm('Xóa phần này và tất cả bài học bên trong?')) return;
    try { await httpClient.delete(`/sections/${sid}`); setSections(prev => prev.filter(s => s.id !== sid)); } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa phần học' }); }
  };
  const addLesson = async (sectionId) => {
    try {
      const targetSection = sections.find(s => s.id === sectionId);
      const order_index = targetSection?.lessons?.length || 0;
      const res = await httpClient.post('/lessons', { section_id: sectionId, title: 'Bài học mới', content_type: 'video', order_index });
      if (res.data.success) setSections(prev => prev.map(s => s.id === sectionId ? { ...s, lessons: [...(s.lessons || []), res.data.data] } : s));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tạo bài học';
      pushToast({ type: 'error', title: 'Lỗi', message: msg });
    }
  };
  const updateLesson = async (lessonId, data) => {
    try {
      await httpClient.put(`/lessons/${lessonId}`, data);
      setSections(prev => prev.map(s => ({ ...s, lessons: (s.lessons || []).map(l => l.id === lessonId ? { ...l, ...data } : l) })));
    } catch { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể cập nhật bài học' }); }
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
    <div className="-mx-4 lg:-mx-8 -my-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-fade-in" ref={menuRef}>
      <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
      {/* Editor Header / Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/courses" className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500 transition text-lg border border-slate-200">←</Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider">Chỉnh sửa</span>
              <span className="text-slate-500 text-xs font-medium">{statusText || 'Tự động lưu'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-800">{course.title || 'Khóa học mới'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && <span className="text-green-600 font-bold text-sm px-3 py-1.5">{saveMsg}</span>}
          <button onClick={publish} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${course.is_published ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'}`}>
            {course.is_published ? '✅ Đã xuất bản' : '🚀 Xuất bản'}
          </button>
        </div>
      </div>
      {/* Course Info */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 transition-shadow">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">📝 Thông tin khóa học</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tên khóa học</label>
              <input value={course.title || ''} onChange={async e => {
                const newTitle = e.target.value;
                updateField('title', newTitle);
                if (autoSyncSlug) {
                  try {
                    const res = await httpClient.post('/admin/courses/slug/suggest', { title: newTitle, excludeId: id });
                    if (res.data.success) updateField('slug', res.data.slug);
                  } catch (err) { console.error(err); }
                }
              }} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 font-medium" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-600">Đường dẫn (Slug)</label>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={autoSyncSlug} onChange={e => setAutoSyncSlug(e.target.checked)} className="rounded text-blue-600" /> Đồng bộ với tên
                  </label>
                  {slugStatus.loading && <span className="text-[10px] text-slate-400">Đang kiểm tra...</span>}
                  {!slugStatus.loading && slugStatus.valid === true && <span className="text-[10px] text-green-600 font-bold">✓ {slugStatus.msg}</span>}
                  {!slugStatus.loading && slugStatus.valid === false && <span className="text-[10px] text-red-600 font-bold">✗ {slugStatus.msg}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <input value={course.slug || ''} onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="tu-khoa-khong-dau" className={`w-full px-4 py-3 border ${slugStatus.valid === false ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'} rounded-xl text-sm focus:outline-none focus:ring-2`} />
                <button onClick={async () => {
                  try {
                    const res = await httpClient.post('/admin/courses/slug/suggest', { title: course.title, excludeId: id });
                    if (res.data.success) updateField('slug', res.data.slug);
                  } catch (err) { pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể tạo slug' }); }
                }} className="px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors" title="Tạo lại slug" type="button">
                  🔄
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Mô tả ngắn</label>
            <textarea value={course.short_description || course.description || ''} onChange={e => updateField('short_description', e.target.value)} rows="2" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Mô tả chi tiết</label>
            <textarea value={course.full_description || ''} onChange={e => updateField('full_description', e.target.value)} rows="5" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="Hỗ trợ Markdown hoặc HTML cơ bản..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Thumbnail URL</label>
              <input value={course.thumbnail || ''} onChange={e => updateField('thumbnail', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Video giới thiệu (Promo Video URL)</label>
              <input value={course.promo_video_url || ''} onChange={e => updateField('promo_video_url', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="https://youtube.com/..." />
            </div>
          </div>
          {course.thumbnail && <img src={course.thumbnail} alt="" className="h-32 rounded-xl object-cover border border-slate-200" />}
        </div>
      </div>

      {/* Course Advanced & Certificate */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 transition-shadow">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">⚙️ Cấu hình mở rộng & Chứng chỉ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Ngôn ngữ</label>
              <select value={course.language || 'vi'} onChange={e => updateField('language', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tags (cách nhau bởi dấu phẩy)</label>
              <input value={(course.tags || []).join(', ')} onChange={e => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="react, frontend, javascript" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Danh mục</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const isSelected = (course.categories || []).some(c => c.id === cat.id) || (course.category_ids || []).includes(cat.id);
                  return (
                    <button key={cat.id} onClick={() => {
                      const currentIds = (course.categories || []).map(c => c.id);
                      const currentFallbackIds = course.category_ids || [];
                      const allCurrentIds = Array.from(new Set([...currentIds, ...currentFallbackIds]));
                      
                      let newIds;
                      if (isSelected) {
                        newIds = allCurrentIds.filter(cid => cid !== cat.id);
                      } else {
                        newIds = [...allCurrentIds, cat.id];
                      }
                      setCourse(prev => ({ ...prev, categories: newIds.map(id => ({ id })), category_ids: newIds }));
                      autoSaveCourse({ category_ids: newIds });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">🎓 Cấu hình chứng chỉ</h3>
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={course.certificate_enabled || false} onChange={e => updateField('certificate_enabled', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="font-semibold text-slate-700">Cấp chứng chỉ khi hoàn thành</span>
            </label>
            <p className="text-xs text-slate-500 ml-7">Học viên sẽ nhận được chứng chỉ sau khi đạt các điều kiện bên dưới.</p>
          </div>

          {course.certificate_enabled && (
            <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Mẫu chứng chỉ</label>
                <select value={course.certificate_template_id || ''} onChange={e => updateField('certificate_template_id', e.target.value ? Number(e.target.value) : null)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                  <option value="">-- Chọn mẫu mặc định --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">% Tiến độ tối thiểu</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" max="100" value={course.certificate_min_progress ?? 100} onChange={e => updateField('certificate_min_progress', Number(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
                  <span className="text-slate-500 font-bold">%</span>
                </div>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-slate-200 mt-2">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={course.certificate_requires_final_assignment || false} onChange={e => updateField('certificate_requires_final_assignment', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="font-semibold text-slate-700 text-sm">Yêu cầu hoàn thành bài kiểm tra cuối khóa</span>
                </label>
              </div>

              {course.certificate_requires_final_assignment && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Điểm tối thiểu cần đạt (bài kiểm tra cuối khóa)</label>
                  <div className="flex items-center gap-2 max-w-[50%]">
                    <input type="number" min="0" max="100" value={course.certificate_pass_percent ?? 80} onChange={e => updateField('certificate_pass_percent', Number(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
                    <span className="text-slate-500 font-bold">%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {course.final_assignment_required && (
          <div className="mt-4">
            <button onClick={() => setShowFinalAssignment(!showFinalAssignment)} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200">
               {showFinalAssignment ? 'Đóng cấu hình bài tập' : '📝 Cấu hình bài tập cuối khóa'}
            </button>
            {showFinalAssignment && (
              <div className="mt-4">
                <AssignmentBuilder courseId={id} isFinal={true} onClose={() => setShowFinalAssignment(false)} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 transition-shadow">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">💰 Giá và cấu hình</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-semibold text-slate-600 mb-1.5">Giá gốc (VNĐ)</label><input type="number" value={course.price || 0} onChange={e => updateField('price', Number(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold" /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1.5">Giá Sale (VNĐ)</label><input type="number" value={course.sale_price || 0} onChange={e => updateField('sale_price', Number(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-red-600" /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1.5">Level</label>
            <select value={course.level || 'beginner'} onChange={e => updateField('level', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm">
              <option value="beginner">Cơ bản</option><option value="intermediate">Trung cấp</option><option value="advanced">Nâng cao</option>
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1.5">Loại khóa học</label>
            <select value={course.type === 'video' ? 'recorded' : (course.type || 'recorded')} onChange={e => updateField('type', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-blue-600">
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
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">📚 Nội dung khóa học <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">{sections.length} phần</span></h2>
            <button onClick={addSection} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition border border-blue-100">+ Thêm phần học</button>
          </div>
        {sections.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-4xl block mb-3 opacity-50">📂</span>
            <p className="mb-4">Chưa có phần học nào</p>
            <button onClick={addSection} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm inline-flex items-center gap-2">
              <span>+</span> Thêm phần học đầu tiên
            </button>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          <SortableContext items={sections.map(s => `section-${s.id}`)} strategy={verticalListSortingStrategy}>
          {sections.map((section, sIdx) => (
            <SortableSection key={section.id} id={section.id}>
            {(attributes, listeners) => (
            <div className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3 flex-1">
                  <div {...attributes} {...listeners} className="cursor-grab hover:bg-slate-200 p-1.5 rounded-lg transition" title="Kéo thả để sắp xếp">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                  </div>
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
              <SortableContext items={(section.lessons || []).map(l => `lesson-${l.id}`)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-slate-100">
                {(section.lessons || []).map((lesson, lIdx) => (
                  <SortableLesson key={lesson.id} id={lesson.id}>
                  {(lessonAttributes, lessonListeners) => (
                  <div className="flex bg-white relative group">
                    <div {...lessonAttributes} {...lessonListeners} className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 hover:bg-slate-100 p-1 rounded transition z-10" title="Kéo thả bài học">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                    </div>
                    <div className="flex-1 ml-4">
                      <LessonCard 
                        lesson={lesson}
                        index={lIdx}
                        sectionId={section.id}
                        courseId={course.id}
                        isFirst={lIdx === 0}
                        isLast={lIdx === (section.lessons || []).length - 1}
                        onUpdate={updateLesson}
                        onDelete={(lId) => deleteLesson(lId, section.id)}
                        onMoveUp={(idx) => reorderLessons(section.id, idx, idx - 1)}
                        onMoveDown={(idx) => reorderLessons(section.id, idx, idx + 1)}
                      />
                    </div>
                  </div>
                  )}
                  </SortableLesson>
                ))}
                {(section.lessons || []).length === 0 && <div className="p-6 text-center text-slate-400 text-sm">Chưa có bài học nào</div>}
              </div>
              </SortableContext>
              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                <button onClick={() => addLesson(section.id)} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition">+ Thêm bài học vào phần này</button>
              </div>
            </div>
            )}
            </SortableSection>
          ))}
          </SortableContext>
        </div>
        </DndContext>
      </div>

      {/* Materials */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 transition-shadow">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">📎 Tài liệu học tập</h2>
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
      </div>
    </div>
  );
}

