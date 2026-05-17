import React, { useState, useEffect } from 'react';
import httpClient from '../../../services/core/httpClient';
import { useToast } from '../../../contexts/ToastContext';

export default function AssignmentViewer({ lessonId, sectionId, courseId, isFinal }) {
  const { pushToast } = useToast();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // MCQ Answers (array of selected option indices)
  const [mcqAnswers, setMcqAnswers] = useState({});
  // Essay Answer (string)
  const [essayAnswer, setEssayAnswer] = useState('');

  useEffect(() => {
    if (lessonId || sectionId || isFinal) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, sectionId, isFinal, courseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/assignments/lesson/${lessonId}`;
      if (isFinal) url = `/assignments/course/${courseId}/final`;
      else if (sectionId) url = `/assignments/section/${sectionId}`;
      
      const assignRes = await httpClient.get(url);
      let assignData = null;
      if (assignRes.data.success) {
         if (isFinal) assignData = assignRes.data.data;
         else assignData = assignRes.data.data.length > 0 ? assignRes.data.data[0] : null;
      }
      
      if (assignData) {
        const assign = assignData;
        setAssignment(assign);
        
        // Fetch submission if exists
        try {
          const subRes = await httpClient.get(`/assignments/${assign.id}/submission`);
          if (subRes.data.success && subRes.data.data) {
            const sub = subRes.data.data;
            setSubmission(sub);
            if (assign.kind === 'mcq' && sub.answers) {
              setMcqAnswers(sub.answers);
            } else if (assign.kind === 'essay' && sub.answers) {
              setEssayAnswer(sub.answers.essayText || '');
            }
          }
        } catch {
          // No submission yet
        }
      } else {
        setAssignment(null);
        setSubmission(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMcqSelect = (qId, optId) => {
    if (submission) return; // Prevent changing if already submitted
    setMcqAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleSubmit = async () => {
    if (!confirm('Bạn có chắc muốn nộp bài? Không thể sửa đổi sau khi nộp.')) return;
    setSubmitting(true);
    try {
      const answers = assignment.kind === 'mcq' ? mcqAnswers : { essayText: essayAnswer };
      const res = await httpClient.post(`/assignments/${assignment.id}/submit`, { answers });
      if (res.data.success) {
        pushToast({ type: 'success', title: 'Thành công', message: 'Nộp bài thành công!' });
        fetchData();
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể nộp bài' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500 animate-pulse">Đang tải bài tập...</div>;
  if (!assignment) return null;

  const isSubmitted = !!submission;

  return (
    <div className="mt-8 bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
        <h3 className="font-black text-indigo-900 text-lg flex items-center gap-2">
          <span>📝</span> {assignment.title}
        </h3>
        <div className="flex gap-2">
          {isSubmitted && (
            <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full border border-green-200">
              Đã nộp bài
            </span>
          )}
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200">
            {assignment.score_max} Điểm
          </span>
        </div>
      </div>
      
      <div className="p-6">
        {assignment.description && (
          <p className="text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl text-sm leading-relaxed border border-slate-100">
            {assignment.description}
          </p>
        )}

        {assignment.kind === 'mcq' && assignment.payload?.questions && (
          <div className="space-y-6">
            {assignment.payload.questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                <h4 className="font-bold text-slate-800 mb-4 flex gap-2 text-sm md:text-base">
                  <span className="text-indigo-600 shrink-0">Câu {qIdx + 1}:</span>
                  <span>{q.questionText || q.question}</span>
                </h4>
                <div className="space-y-2 pl-2 md:pl-10">
                  {q.options.map((opt, oIdx) => {
                    const isOldFormat = typeof opt === 'string';
                    const optId = isOldFormat ? oIdx : opt.id;
                    const optText = isOldFormat ? opt : opt.text;
                    const qId = q.id || qIdx;
                    
                    const isSelected = mcqAnswers[qId] === optId;
                    const isCorrect = isSubmitted && (q.correctOptionId !== undefined ? q.correctOptionId === optId : q.correctAnswer === optId);
                    const isWrongSelection = isSubmitted && isSelected && !isCorrect;
                    
                    let bgClass = isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100';
                    if (isSubmitted) {
                      if (isCorrect) bgClass = 'bg-green-50 border-green-400 font-bold';
                      else if (isWrongSelection) bgClass = 'bg-red-50 border-red-300';
                      else bgClass = 'bg-slate-50 border-slate-200 opacity-50';
                    }

                    return (
                      <button
                        key={optId}
                        disabled={isSubmitted}
                        onClick={() => handleMcqSelect(qId, optId)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${bgClass}`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0
                          ${isSelected ? 'border-indigo-600' : 'border-slate-300'}
                          ${isCorrect ? 'border-green-600 bg-green-600 text-white' : ''}
                          ${isWrongSelection ? 'border-red-500 bg-red-500 text-white' : ''}
                        `}>
                          {isSelected && !isSubmitted && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                          {isCorrect && <span className="text-[10px]">✓</span>}
                          {isWrongSelection && <span className="text-[10px]">✕</span>}
                        </div>
                        <span className={`text-sm ${isSubmitted && isCorrect ? 'text-green-800' : isWrongSelection ? 'text-red-700' : 'text-slate-700'}`}>
                          {optText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {assignment.kind === 'essay' && (
          <div className="space-y-4">
            {assignment.payload?.criteria && (
              <div className="text-sm text-slate-600 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <h5 className="font-bold text-blue-800 mb-1">Hướng dẫn làm bài:</h5>
                <p className="whitespace-pre-wrap">{assignment.payload.criteria}</p>
              </div>
            )}
            <textarea
              disabled={isSubmitted}
              value={essayAnswer}
              onChange={e => setEssayAnswer(e.target.value)}
              placeholder="Nhập câu trả lời của bạn..."
              className="w-full min-h-[200px] p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>
        )}

        {isSubmitted ? (
          <div className="mt-6 p-4 rounded-xl border border-indigo-100 bg-indigo-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-indigo-900 mb-1">Kết quả bài làm</p>
              <p className={`text-xs font-bold ${submission.status === 'passed' ? 'text-green-600' : submission.status === 'failed' ? 'text-red-600' : 'text-indigo-600'}`}>
                Trạng thái: {submission.status === 'passed' ? 'Đạt' : submission.status === 'failed' ? 'Không đạt' : submission.status === 'graded' ? 'Đã chấm điểm' : 'Đang chờ chấm'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-indigo-600">{submission.score}</span>
              <span className="text-sm font-bold text-indigo-400">/{assignment.score_max}</span>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-500/30 disabled:opacity-50"
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài tập'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

