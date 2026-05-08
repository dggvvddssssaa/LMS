import React, { useState, useEffect } from 'react';
import httpClient from '../../../../services/core/httpClient';
import { useToast } from '../../../../contexts/ToastContext';

export default function AssignmentBuilder({ lessonId, courseId, onClose }) {
  const { pushToast } = useToast();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('Bài tập trắc nghiệm');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState('mcq'); // 'mcq' or 'essay'
  const [scoreMax, setScoreMax] = useState(100);
  
  // MCQ specific payload
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);

  // Essay specific payload
  const [essayCriteria, setEssayCriteria] = useState('');

  useEffect(() => {
    fetchAssignment();
  }, [lessonId]);

  const fetchAssignment = async () => {
    try {
      const res = await httpClient.get(`/assignments/lesson/${lessonId}`);
      if (res.data.success && res.data.data.length > 0) {
        const existing = res.data.data[0];
        setAssignment(existing);
        setTitle(existing.title || '');
        setDescription(existing.description || '');
        setKind(existing.kind || 'mcq');
        setScoreMax(existing.score_max || 100);
        
        if (existing.kind === 'mcq' && existing.payload?.questions) {
          setQuestions(existing.payload.questions);
        } else if (existing.kind === 'essay' && existing.payload?.criteria) {
          setEssayCriteria(existing.payload.criteria);
        }
      }
    } catch (err) {
      console.error('Error fetching assignment', err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const updateQuestion = (qIdx, field, value) => {
    const updated = [...questions];
    updated[qIdx][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const removeQuestion = (qIdx) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== qIdx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = kind === 'mcq' 
        ? { questions } 
        : { criteria: essayCriteria };
        
      const data = {
        lesson_id: lessonId,
        course_id: courseId,
        title,
        description,
        kind,
        payload,
        score_max: Number(scoreMax)
      };

      if (assignment?.id) {
        await httpClient.put(`/assignments/${assignment.id}`, data);
        pushToast({ type: 'success', title: 'Thành công', message: 'Cập nhật bài tập thành công!' });
      } else {
        await httpClient.post('/assignments', data);
        pushToast({ type: 'success', title: 'Thành công', message: 'Tạo bài tập thành công!' });
      }
      onClose();
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể lưu bài tập' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;
    try {
      await httpClient.delete(`/assignments/${assignment.id}`);
      onClose();
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa bài tập' });
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500 animate-pulse">Đang tải cấu hình bài tập...</div>;
  }

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 mt-4 shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-50 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <span>📝</span> {assignment ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕ Đóng</button>
      </div>

      <div className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Tiêu đề</label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Điểm tối đa</label>
            <input 
              type="number"
              value={scoreMax} 
              onChange={e => setScoreMax(e.target.value)} 
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Mô tả ngắn gọn (không bắt buộc)</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows="2" 
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Loại bài tập</label>
          <div className="flex bg-slate-100 rounded-xl p-1 max-w-sm">
            <button 
              onClick={() => setKind('mcq')} 
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${kind === 'mcq' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ✅ Trắc nghiệm (MCQ)
            </button>
            <button 
              onClick={() => setKind('essay')} 
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${kind === 'essay' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ✍️ Tự luận (Essay)
            </button>
          </div>
        </div>

        {/* Dynamic payload section */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
          {kind === 'mcq' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-700 text-sm">Danh sách câu hỏi</h4>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{questions.length} câu</span>
              </div>
              
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative group">
                  <button 
                    onClick={() => removeQuestion(qIdx)} 
                    className="absolute -top-3 -right-3 w-7 h-7 bg-white border border-red-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-50"
                  >✕</button>
                  
                  <div className="mb-3 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mt-1">{qIdx + 1}</span>
                    <textarea 
                      value={q.questionText} 
                      onChange={e => updateQuestion(qIdx, 'questionText', e.target.value)}
                      placeholder="Nội dung câu hỏi..." 
                      className="w-full px-3 py-2 border-b border-dashed border-slate-300 focus:border-indigo-400 focus:outline-none resize-none bg-transparent text-sm font-medium"
                      rows="2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${q.correctAnswer === oIdx ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                        <input 
                          type="radio" 
                          name={`correct-${qIdx}`} 
                          checked={q.correctAnswer === oIdx}
                          onChange={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <input 
                          value={opt} 
                          onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                          placeholder={`Lựa chọn ${['A', 'B', 'C', 'D'][oIdx]}`}
                          className="w-full bg-transparent border-none focus:outline-none text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addQuestion} 
                className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:border-indigo-300 transition"
              >
                + Thêm câu hỏi
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-sm">Tiêu chí chấm điểm (Hướng dẫn làm bài)</h4>
              <textarea 
                value={essayCriteria} 
                onChange={e => setEssayCriteria(e.target.value)}
                placeholder="Ví dụ: Sinh viên cần phân tích rõ 3 luận điểm chính. Mỗi luận điểm 30 điểm, trình bày 10 điểm..." 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[150px]"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center relative z-10 pt-4 border-t border-slate-100">
        {assignment ? (
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1">
            🗑️ Xóa bài tập
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            Hủy
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-500/30 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : (assignment ? 'Cập nhật' : 'Tạo bài tập')}
          </button>
        </div>
      </div>
    </div>
  );
}

