import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';
import { useToast } from '../../contexts/ToastContext';
import { LoadingState, ErrorState } from '../../components/ui';

export default function AdminCertificateTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    httpClient.get(`/certificate-templates/${id}`)
      .then(res => setTemplate(res.data.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field, value) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await httpClient.put(`/certificate-templates/${id}`, template);
      pushToast({ type: 'success', title: 'Lưu mẫu chứng chỉ thành công' });
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi khi lưu', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải mẫu chứng chỉ..." />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="-mx-4 lg:-mx-8 -my-8 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-10 shadow-sm">
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

      <div className="container mx-auto max-w-7xl px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Controls */}
        <div className="w-full lg:w-1/3 space-y-6">
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
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Thiết kế & Nội dung</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Ảnh nền (URL)</label>
                <input value={template.background_url || ''} onChange={e => updateField('background_url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tên Đơn Vị Cấp (Issuer Name)</label>
                <input value={template.issuer_name || ''} onChange={e => updateField('issuer_name', e.target.value)} placeholder="Ví dụ: Trung tâm LMSEdu" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Chức danh Đơn Vị (Issuer Title)</label>
                <input value={template.issuer_title || ''} onChange={e => updateField('issuer_title', e.target.value)} placeholder="Ví dụ: ĐẠI DIỆN TRUNG TÂM" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="w-full lg:w-2/3 flex flex-col items-center justify-center p-8 bg-slate-200 rounded-3xl border-4 border-dashed border-slate-300">
          <p className="text-slate-500 font-bold mb-4">Live Preview</p>
          
          {/* Certificate Container */}
          <div className="w-full max-w-4xl bg-white shadow-2xl relative overflow-hidden" style={{ aspectRatio: '1.414' }}>
            {template.background_url && (
              <img src={template.background_url} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12 text-center">
              {/* Fake Logo / Platform Name */}
              <div className="mb-6">
                <h1 className="text-4xl font-black text-blue-700 tracking-wider">
                  LMSEdu
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                  Nền Tảng Giáo Dục Trực Tuyến
                </p>
              </div>

              <h2 className="text-xl uppercase tracking-[0.25em] text-slate-500 font-bold mb-2">
                Chứng Nhận Hoàn Thành
              </h2>
              <p className="text-sm text-slate-500 mb-8">Chứng nhận rằng</p>

              <h3 className="text-5xl font-black text-slate-800 mb-2">
                [Tên Học Viên]
              </h3>
              
              <p className="text-lg text-slate-600 mb-4 mt-8">
                Đã hoàn thành xuất sắc toàn bộ nội dung của khóa học
              </p>
              <h4 className="text-3xl font-black text-blue-700">
                [Tên Khóa Học]
              </h4>

              <div className="absolute bottom-12 left-16 text-left">
                <p className="text-xs text-slate-400 font-bold uppercase">Ngày Cấp</p>
                <p className="text-lg font-black text-slate-700">[DD/MM/YYYY]</p>
              </div>

              <div className="absolute bottom-12 right-16 text-center">
                <p className="text-xs text-slate-400 font-bold uppercase mb-8">{template.issuer_title || '[Chức Danh]'}</p>
                <p className="text-lg font-black text-slate-700">{template.issuer_name || '[Tên Người Ký]'}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
