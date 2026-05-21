import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';
import { useToast } from '../../contexts/ToastContext';
import { LoadingState, ErrorState } from '../../components/ui';

const DEFAULT_ELEMENTS = [
  { id: 'title', type: 'text', text: 'Chứng Nhận Hoàn Thành', x: 200, y: 100, fontSize: 32, fontWeight: 'bold', color: '#64748b', align: 'center', width: 600 },
  { id: 'student_name', type: 'text', text: '[Tên Học Viên]', x: 200, y: 200, fontSize: 48, fontWeight: '900', color: '#1e293b', align: 'center', width: 600 },
  { id: 'desc', type: 'text', text: 'Đã hoàn thành xuất sắc khóa học', x: 200, y: 300, fontSize: 18, fontWeight: 'normal', color: '#475569', align: 'center', width: 600 },
  { id: 'course_title', type: 'text', text: '[Tên Khóa Học]', x: 100, y: 350, fontSize: 36, fontWeight: '900', color: '#1d4ed8', align: 'center', width: 800 },
  { id: 'date', type: 'text', text: '[Ngày Cấp]', x: 100, y: 550, fontSize: 18, fontWeight: 'bold', color: '#334155', align: 'left', width: 300 },
  { id: 'issuer_title', type: 'text', text: '[Chức Danh]', x: 600, y: 500, fontSize: 14, fontWeight: 'bold', color: '#64748b', align: 'center', width: 300 },
  { id: 'issuer_name', type: 'text', text: '[Người Ký]', x: 600, y: 550, fontSize: 20, fontWeight: 'bold', color: '#334155', align: 'center', width: 300 }
];

export default function AdminCertificateTemplateEditor() {
  const { id } = useParams();
  const { pushToast } = useToast();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    httpClient.get(`/certificate-templates/${id}`)
      .then(res => {
        const t = res.data.data;
        setTemplate(t);
        if (t.layout_json && t.layout_json.elements) {
          setElements(t.layout_json.elements);
        } else {
          setElements(DEFAULT_ELEMENTS);
        }
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field, value) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...template,
        layout_json: { elements }
      };
      await httpClient.put(`/certificate-templates/${id}`, payload);
      pushToast({ type: 'success', title: 'Lưu mẫu chứng chỉ thành công' });
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi khi lưu', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleMouseDown = (e, elId) => {
    e.stopPropagation();
    setSelectedId(elId);
    setIsDragging(true);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const el = elements.find(el => el.id === elId);
    
    // Calculate the actual scale ratio
    const scale = 1000 / containerRect.width;

    const mouseX = (e.clientX - containerRect.left) * scale;
    const mouseY = (e.clientY - containerRect.top) * scale;
    
    setDragOffset({
      x: mouseX - el.x,
      y: mouseY - el.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedId || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const scale = 1000 / containerRect.width;
    
    let x = (e.clientX - containerRect.left) * scale - dragOffset.x;
    let y = (e.clientY - containerRect.top) * scale - dragOffset.y;
    
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x, y } : el));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateSelectedElement = (key, value) => {
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, [key]: value } : el));
  };

  const selectedEl = elements.find(el => el.id === selectedId);

  if (loading) return <LoadingState label="Đang tải mẫu chứng chỉ..." />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="-mx-4 lg:-mx-8 -my-8 min-h-screen bg-slate-50" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin/certificate-templates" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Chỉnh sửa mẫu chứng chỉ</h1>
              <p className="text-xs text-slate-500 mt-0.5">#{id} - {template.name}</p>
            </div>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-sm transition flex items-center gap-2 ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Sidebar Controls */}
        <div className="w-full lg:w-1/3 space-y-6 sticky top-24">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Thông tin cơ bản</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tên mẫu</label>
                <input value={template.name || ''} onChange={e => updateField('name', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Trạng thái</label>
                <select value={template.status || 'draft'} onChange={e => updateField('status', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none bg-white">
                  <option value="draft">Bản nháp</option>
                  <option value="active">Đang áp dụng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Ảnh nền (URL)</label>
                <input value={template.background_url || ''} onChange={e => updateField('background_url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
            </div>
          </div>

          {selectedEl && (
            <div className="bg-blue-50 rounded-2xl shadow-sm border border-blue-200 p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4 border-b border-blue-200 pb-2">Chỉnh sửa Element: {selectedEl.id}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">Text / Placeholder</label>
                  <input value={selectedEl.text} onChange={e => updateSelectedElement('text', e.target.value)} className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">Cỡ chữ (px)</label>
                    <input type="number" value={selectedEl.fontSize} onChange={e => updateSelectedElement('fontSize', Number(e.target.value))} className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">Độ đậm</label>
                    <select value={selectedEl.fontWeight} onChange={e => updateSelectedElement('fontWeight', e.target.value)} className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white outline-none">
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">Màu sắc</label>
                    <input type="color" value={selectedEl.color} onChange={e => updateSelectedElement('color', e.target.value)} className="w-full h-8 border border-blue-200 rounded-lg bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">Căn lề</label>
                    <select value={selectedEl.align} onChange={e => updateSelectedElement('align', e.target.value)} className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white outline-none">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">Chiều rộng khung (px)</label>
                  <input type="number" value={selectedEl.width} onChange={e => updateSelectedElement('width', Number(e.target.value))} className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white outline-none" />
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-sm text-amber-800">
            <p className="font-bold mb-1">Hướng dẫn:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Click và kéo các đoạn text bên phải để di chuyển.</li>
              <li>Sử dụng các biến như <code className="bg-amber-100 px-1 rounded">[Tên Học Viên]</code>, <code className="bg-amber-100 px-1 rounded">[Tên Khóa Học]</code>, <code className="bg-amber-100 px-1 rounded">[Ngày Cấp]</code> để hệ thống tự động điền.</li>
            </ul>
          </div>
        </div>

        {/* Live Canvas */}
        <div className="w-full lg:w-2/3 flex flex-col items-center">
          {/* Certificate Container fixed logical size 1000x707 for consistency */}
          <div 
            className="w-full bg-white shadow-2xl relative overflow-hidden" 
            style={{ aspectRatio: '1.414' }}
          >
            {/* Inner scaler to map logical 1000x707 to fluid width */}
            <div 
              ref={containerRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{
                 // We will render elements using % or a nested scale, 
                 // but a simpler way is to use container units or SVG-like coordinate mapping.
                 // Using a wrapper that forces an aspect ratio and percentage positioning is responsive.
              }}
              onClick={() => setSelectedId(null)}
            >
              {template.background_url && (
                <img src={template.background_url} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
              )}
              
              {/* Virtual Canvas 1000x707 mapped to percentage */}
              {elements.map(el => {
                const isSelected = selectedId === el.id;
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    className={`absolute cursor-move select-none ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-slate-300'}`}
                    style={{
                      left: `${(el.x / 1000) * 100}%`,
                      top: `${(el.y / 707) * 100}%`,
                      width: `${(el.width / 1000) * 100}%`,
                      color: el.color,
                      fontWeight: el.fontWeight,
                      textAlign: el.align,
                      containerType: 'inline-size',
                      transform: 'translate(0, 0)',
                    }}
                  >
                    <div style={{ fontSize: `${el.fontSize / 10}cqw` }}>
                      {el.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
