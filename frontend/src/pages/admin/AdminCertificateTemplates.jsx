import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';
import { useToast } from '../../contexts/ToastContext';
import { LoadingState, ErrorState } from '../../components/ui';

export default function AdminCertificateTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { pushToast } = useToast();

  const fetchTemplates = () => {
    setLoading(true);
    httpClient.get('/certificate-templates')
      .then(res => setTemplates(res.data.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await httpClient.post('/certificate-templates', { name: 'Mẫu chứng chỉ mới' });
      if (res.data.success) {
        setTemplates(prev => [res.data.data, ...prev]);
        pushToast({ type: 'success', title: 'Đã tạo mẫu mới' });
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Không thể tạo', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa mẫu chứng chỉ này?')) return;
    try {
      await httpClient.delete(`/certificate-templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      pushToast({ type: 'success', title: 'Đã xóa mẫu chứng chỉ' });
    } catch (err) {
      pushToast({ type: 'error', title: 'Không thể xóa', message: err.message });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await httpClient.post(`/certificate-templates/${id}/duplicate`);
      if (res.data.success) {
        setTemplates(prev => [res.data.data, ...prev]);
        pushToast({ type: 'success', title: 'Đã nhân bản mẫu chứng chỉ' });
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Không thể nhân bản', message: err.message });
    }
  };

  if (loading) return <LoadingState label="Đang tải mẫu chứng chỉ..." />;
  if (error) return <ErrorState message={error.message} onRetry={fetchTemplates} />;

  return (
    <div className="-mx-4 lg:-mx-8 -my-8 min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 py-6 px-4 mb-8">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mẫu Chứng Chỉ</h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý và thiết kế các mẫu chứng nhận hoàn thành khóa học.</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm transition">
            + Tạo mẫu mới
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="aspect-[1.414] bg-slate-100 relative flex items-center justify-center p-4">
                {t.background_url ? (
                  <img src={t.background_url} alt="" className="w-full h-full object-cover rounded-md opacity-50" />
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                    Chưa có hình nền
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center font-serif text-center pointer-events-none p-4">
                  <div className="text-sm font-bold text-slate-700">{t.issuer_name || 'Tên Đơn Vị'}</div>
                  <div className="text-lg font-black text-blue-900 mt-2 line-clamp-2">{t.name}</div>
                </div>
              </div>
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{t.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.status === 'active' ? 'Đang áp dụng' : 'Bản nháp'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-slate-100 pt-4 mt-auto">
                  <Link to={`/admin/certificate-templates/${t.id}/editor`} className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-100 transition text-center flex items-center justify-center">
                    ✏️ Thiết kế
                  </Link>
                  <button onClick={() => handleDuplicate(t.id)} className="px-3 py-2 bg-slate-50 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-100 transition" title="Nhân bản">
                    📋
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="px-3 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 transition" title="Xóa">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              Chưa có mẫu chứng chỉ nào. Vui lòng tạo mới.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
