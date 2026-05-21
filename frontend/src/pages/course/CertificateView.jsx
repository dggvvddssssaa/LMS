import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';

export default function CertificateView() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await httpClient.get(`/certificates/${id}`);
        if (res.data.success) {
          setCert(res.data.data);
          // fetch template
          if (res.data.data.template_id) {
             const tRes = await httpClient.get(`/certificate-templates/${res.data.data.template_id}`);
             setTemplate(tRes.data.data);
          }
        } else {
          setError('Không tìm thấy chứng chỉ');
        }
      } catch {
        setError('Không thể tải chứng chỉ');
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 text-lg font-bold">Đang tải chứng chỉ...</div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😞</div>
        <p className="text-slate-600 text-lg font-bold">{error || 'Không tìm thấy chứng chỉ'}</p>
        <Link to="/dashboard" className="text-blue-600 font-bold hover:underline">← Quay lại Dashboard</Link>
      </div>
    );
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const replacePlaceholders = (text) => {
    if (!text) return '';
    return text
      .replace(/\[Tên Học Viên\]/g, cert.student_name_snapshot || cert.student_name || '')
      .replace(/\[Tên Khóa Học\]/g, cert.course_title_snapshot || cert.course_title || '')
      .replace(/\[Ngày Cấp\]/g, cert.issued_date_text || issuedDate)
      .replace(/\[Mã Chứng Chỉ\]/g, `#${cert.certificate_code || String(cert.id).padStart(6, '0')}`)
      .replace(/\[Người Ký\]/g, template?.issuer_name || cert.instructor_name_snapshot || '')
      .replace(/\[Chức Danh\]/g, template?.issuer_title || 'Giảng Viên');
  };

  const hasJsonLayout = template && template.layout_json && template.layout_json.elements && template.layout_json.elements.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      {/* Action Bar - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-bold transition">
            <span>←</span> Quay lại
          </Link>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <span>🖨️</span> In Chứng Chỉ
          </button>
        </div>
      </div>

      {/* Certificate Container */}
      <div className="container mx-auto px-4 py-12 print:py-0 print:px-0 flex justify-center">
        {hasJsonLayout ? (
           <div 
             id="certificate-content"
             className="w-full max-w-4xl bg-white relative overflow-hidden print:shadow-none shadow-2xl" 
             style={{ aspectRatio: '1.414' }}
           >
             <div className="absolute top-0 left-0 w-full h-full">
               {template.background_url && (
                 <img src={template.background_url} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
               )}
               
               {template.layout_json.elements.map(el => (
                 <div
                   key={el.id}
                   className="absolute select-none"
                   style={{
                     left: `${(el.x / 1000) * 100}%`,
                     top: `${(el.y / 707) * 100}%`,
                     width: `${(el.width / 1000) * 100}%`,
                     color: el.color,
                     fontWeight: el.fontWeight,
                     textAlign: el.align,
                     containerType: 'inline-size',
                   }}
                 >
                   <div style={{ fontSize: `${el.fontSize / 10}cqw` }}>
                     {replacePlaceholders(el.text)}
                   </div>
                 </div>
               ))}
             </div>
           </div>
        ) : (
          <div 
            id="certificate-content"
            className="w-full max-w-4xl bg-white rounded-3xl print:rounded-none shadow-2xl print:shadow-none overflow-hidden border border-slate-200 print:border-0"
            style={{ aspectRatio: '1.414' }}
          >
            {/* Fallback Template Body */}
            <div className="h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            <div className="relative h-full flex flex-col justify-center px-10 md:px-16 text-center -mt-8">
              {template?.background_url && (
                 <img src={template.background_url} className="absolute inset-0 w-full h-full object-cover opacity-10" alt="bg"/>
              )}
              <div className="relative z-10">
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">LMSEdu</h1>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Nền Tảng Giáo Dục Trực Tuyến</p>
                </div>
                <h2 className="text-lg md:text-xl uppercase tracking-[0.25em] text-slate-400 font-bold mb-3">Chứng Nhận Hoàn Thành</h2>
                <p className="text-base text-slate-500 mb-8">Chứng nhận rằng</p>
                <h3 className="text-4xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">{cert.student_name_snapshot || cert.student_name}</h3>
                <p className="text-sm text-slate-400 mb-10">{cert.student_email_snapshot || cert.student_email}</p>
                <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-4">Đã hoàn thành xuất sắc toàn bộ nội dung của khóa học</p>
                <div className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-8 py-4 mb-10">
                  <h4 className="text-2xl md:text-3xl font-black text-blue-700 tracking-tight">{cert.course_title_snapshot || cert.course_title}</h4>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mt-6 mb-8">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Ngày Cấp</p>
                    <p className="text-lg font-black text-slate-700">{cert.issued_date_text || issuedDate}</p>
                  </div>
                  {(cert.instructor_name_snapshot || cert.instructor_name) && (
                    <div className="text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Giảng Viên</p>
                      <p className="text-lg font-black text-slate-700">{cert.instructor_name_snapshot || cert.instructor_name}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Mã Chứng Chỉ</p>
                    <p className="text-lg font-black text-blue-600 font-mono">#{cert.certificate_code || String(cert.id).padStart(6, '0')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"></div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-content, #certificate-content * { visibility: visible; }
          #certificate-content { 
            position: fixed !important; 
            left: 0 !important; top: 0 !important; 
            width: 100vw !important; 
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          @page { size: landscape; margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
