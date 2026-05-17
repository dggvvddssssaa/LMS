import React, { useState, useEffect, useCallback } from 'react';
import { qaService } from '../services';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../contexts/ToastContext';

const CourseQA = ({ courseId, activeLessonId }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const { user } = useAuthStore();
    const { pushToast } = useToast();

    useEffect(() => {
        fetchQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, activeLessonId]);

    const fetchQuestions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await qaService.getQuestions(courseId, activeLessonId);
            if (res.success) {
                setQuestions(res.data);
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể tải Q&A', message: err.message });
        } finally {
            setLoading(false);
        }
    }, [courseId, activeLessonId, pushToast]);

    const handlePostQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.title.trim() || !newQuestion.content.trim()) return;

        try {
            const res = await qaService.postQuestion({
                courseId,
                lessonId: activeLessonId,
                title: newQuestion.title,
                content: newQuestion.content,
            });
            if (res.success) {
                setNewQuestion({ title: '', content: '' });
                fetchQuestions();
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể gửi câu hỏi', message: err.message });
        }
    };

    const handlePostAnswer = async (questionId) => {
        if (!replyContent.trim()) return;
        try {
            const res = await qaService.postAnswer({ questionId, content: replyContent });
            if (res.success) {
                setReplyingTo(null);
                setReplyContent('');
                fetchQuestions();
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể gửi trả lời', message: err.message });
        }
    };

    const handleAcceptAnswer = async (answerId) => {
        try {
            const res = await qaService.acceptAnswer(answerId);
            if (res.success) {
                fetchQuestions();
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể duyệt câu trả lời', message: err.message });
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Đang tải câu hỏi...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <form onSubmit={handlePostQuestion} className="space-y-3">
                    <input
                        type="text"
                        placeholder="Tiêu đề câu hỏi..."
                        value={newQuestion.title}
                        onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                        placeholder="Nội dung chi tiết..."
                        value={newQuestion.content}
                        onChange={e => setNewQuestion({ ...newQuestion, content: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                    />
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                        Gửi câu hỏi
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {questions.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm py-8">Chưa có câu hỏi nào cho bài học này.</div>
                ) : questions.map(q => (
                    <div key={q.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="p-4 border-b border-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800 text-sm leading-snug">{q.title}</h4>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                    {new Date(q.created_at).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">{q.content}</p>

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                        {q.author_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">{q.author_name}</span>
                                    {q.author_role !== 'student' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded">GV</span>}
                                </div>
                                <button onClick={() => setReplyingTo(replyingTo === q.id ? null : q.id)} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                    {q.answers?.length || 0} Trả lời
                                </button>
                            </div>
                        </div>

                        {q.answers && q.answers.length > 0 && (
                            <div className="bg-slate-50 p-4 space-y-3">
                                {q.answers.map(a => (
                                    <div key={a.id} className={`p-3 rounded-lg text-sm border ${a.is_accepted ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-100'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-700">{a.author_name}</span>
                                                {a.author_role !== 'student' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded">GV</span>}
                                                {a.is_accepted && <span className="text-[10px] bg-green-500 text-white px-1.5 rounded">Đã duyệt ✓</span>}
                                            </div>
                                            {(user?.id === q.author_id || user?.role === 'instructor' || user?.role === 'admin') && (
                                                <button onClick={() => handleAcceptAnswer(a.id)} className={`text-[10px] font-bold ${a.is_accepted ? 'text-slate-400' : 'text-green-600'}`}>
                                                    {a.is_accepted ? 'Bỏ duyệt' : 'Duyệt'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-slate-600 whitespace-pre-wrap">{a.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {replyingTo === q.id && (
                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    placeholder="Viết câu trả lời..."
                                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
                                />
                                <button onClick={() => handlePostAnswer(q.id)} className="bg-blue-600 text-white px-3 rounded-lg text-sm font-bold">Gửi</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseQA;
