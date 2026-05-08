import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import httpClient from '../../services/core/httpClient';

export default function CertificateView() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await httpClient.get(`/certificates/${id}`);
        if (res.data.success) {
          setCert(res.data.data);
        } else {
          setError('Không tìm thấy chứng chỉ');
        }
      } catch (err) {
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
    month: 'long',
    year: 'numeric'
  });

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
      <div className="container mx-auto px-4 py-12 print:py-0 print:px-0">
        <div 
          id="certificate-content"
          className="max-w-4xl mx-auto bg-white rounded-3xl print:rounded-none shadow-2xl print:shadow-none overflow-hidden border border-slate-200 print:border-0"
        >
          {/* Decorative Top Border */}
          <div className="h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

          {/* Certificate Body */}
          <div className="relative px-10 md:px-16 py-14 md:py-20 text-center">
            {/* Corner Decorations */}
            <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-blue-200 rounded-tl-2xl opacity-60"></div>
            <div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-blue-200 rounded-tr-2xl opacity-60"></div>
            <div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 border-blue-200 rounded-bl-2xl opacity-60"></div>
            <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-blue-200 rounded-br-2xl opacity-60"></div>

            {/* Logo / Platform Name */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                LMSEdu
              </h1>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">
                Nền Tảng Giáo Dục Trực Tuyến
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-blue-300"></div>
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-400/50"></div>
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-blue-300"></div>
            </div>

            {/* Title */}
            <h2 className="text-lg md:text-xl uppercase tracking-[0.25em] text-slate-400 font-bold mb-3">
              Chứng Nhận Hoàn Thành
            </h2>
            <p className="text-base text-slate-500 mb-8">Chứng nhận rằng</p>

            {/* Student Name */}
            <h3 className="text-4xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">
              {cert.student_name}
            </h3>
            <p className="text-sm text-slate-400 mb-10">{cert.student_email}</p>

            {/* Description */}
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-4">
              Đã hoàn thành xuất sắc toàn bộ nội dung của khóa học
            </p>

            {/* Course Name */}
            <div className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-8 py-4 mb-10">
              <h4 className="text-2xl md:text-3xl font-black text-blue-700 tracking-tight">
                {cert.course_title}
              </h4>
            </div>

            {/* Issued Info */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mt-6 mb-8">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Ngày Cấp</p>
                <p className="text-lg font-black text-slate-700">{issuedDate}</p>
              </div>
              {cert.instructor_name && (
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Giảng Viên</p>
                  <p className="text-lg font-black text-slate-700">{cert.instructor_name}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Mã Chứng Chỉ</p>
                <p className="text-lg font-black text-blue-600 font-mono">#{String(cert.id).padStart(6, '0')}</p>
              </div>
            </div>

            {/* Signature Line */}
            <div className="flex items-end justify-center gap-12 mt-10 pt-6">
              <div className="text-center">
                <div className="w-40 h-px bg-slate-300 mb-2"></div>
                <p className="text-xs text-slate-400 font-bold uppercase">Ban Giám Đốc</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-2 opacity-80">🏅</div>
              </div>
              <div className="text-center">
                <div className="w-40 h-px bg-slate-300 mb-2"></div>
                <p className="text-xs text-slate-400 font-bold uppercase">Giảng Viên</p>
              </div>
            </div>
          </div>

          {/* Decorative Bottom Border */}
          <div className="h-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"></div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-content, #certificate-content * { visibility: visible; }
          #certificate-content { 
            position: fixed; 
            left: 0; top: 0; 
            width: 100%; 
            margin: 0;
            box-shadow: none !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

