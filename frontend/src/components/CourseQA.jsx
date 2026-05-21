import React, { useState, useEffect, useCallback, useRef } from 'react';
import { qaService } from '../services';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../contexts/ToastContext';
import '../styles/CourseQA.css';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '🎉'];

const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

const getAvatarClass = (role) => {
    if (role === 'admin') return 'qa-avatar qa-avatar-admin qa-answer-avatar';
    if (role === 'instructor') return 'qa-avatar qa-avatar-instructor qa-answer-avatar';
    return 'qa-avatar qa-avatar-student qa-answer-avatar';
};

const getFullAvatarClass = (role) => {
    if (role === 'admin') return 'qa-avatar qa-avatar-admin';
    if (role === 'instructor') return 'qa-avatar qa-avatar-instructor';
    return 'qa-avatar qa-avatar-student';
};

// Reaction Bar component
const ReactionBar = ({ reactions = [], myReactions = [], onToggle, targetType, targetId }) => {
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowPicker(false);
            }
        };
        if (showPicker) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showPicker]);

    const handleEmojiClick = (emoji) => {
        onToggle(targetType, targetId, emoji);
        setShowPicker(false);
    };

    return (
        <div className="qa-reaction-bar">
            {reactions.filter(r => r.count > 0).map(r => (
                <button
                    key={r.emoji}
                    className={`qa-reaction-btn ${myReactions.includes(r.emoji) ? 'active' : ''}`}
                    onClick={() => onToggle(targetType, targetId, r.emoji)}
                    title={r.emoji}
                >
                    <span>{r.emoji}</span>
                    <span className="count">{r.count}</span>
                </button>
            ))}
            <div ref={pickerRef} style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                    className="qa-add-reaction"
                    onClick={() => setShowPicker(!showPicker)}
                    title="Thêm reaction"
                >
                    😊
                </button>
                {showPicker && (
                    <div className="qa-emoji-picker">
                        {EMOJI_LIST.map(emoji => (
                            <button key={emoji} onClick={() => handleEmojiClick(emoji)}>
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CourseQA = ({ courseId, activeLessonId }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showComposer, setShowComposer] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
    const [posting, setPosting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const { user } = useAuthStore();
    const { pushToast } = useToast();

    const fetchQuestions = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const res = await qaService.getQuestions(courseId, activeLessonId);
            if (res.success) {
                setQuestions(res.data || []);
            }
        } catch (err) {
            setError(err.message || 'Không thể tải câu hỏi');
            pushToast({ type: 'error', title: 'Không thể tải Q&A', message: err.message });
        } finally {
            setLoading(false);
        }
    }, [courseId, activeLessonId, pushToast]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handlePostQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.title.trim() || !newQuestion.content.trim()) return;

        try {
            setPosting(true);
            const res = await qaService.postQuestion({
                courseId,
                lessonId: activeLessonId,
                title: newQuestion.title,
                content: newQuestion.content,
            });
            if (res.success) {
                setNewQuestion({ title: '', content: '' });
                setShowComposer(false);
                fetchQuestions();
                pushToast({ type: 'success', title: 'Đã đăng câu hỏi' });
            }
        } catch (err) {
            pushToast({ type: 'error', title: 'Không thể gửi câu hỏi', message: err.message });
        } finally {
            setPosting(false);
        }
    };

    const handlePostAnswer = async (questionId) => {
        if (!replyContent.trim()) return;
        try {
            const res = await qaService.postAnswer({ questionId, content: replyContent });
            if (res.success) {
                setReplyingTo(null);
                setReplyContent('');
                setExpandedQuestions(prev => ({ ...prev, [questionId]: true }));
                fetchQuestions();
                pushToast({ type: 'success', title: 'Đã gửi trả lời' });
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

    const handleToggleReaction = async (targetType, targetId, emoji) => {
        // Optimistic update
        setQuestions(prev => prev.map(q => {
            if (targetType === 'question' && q.id === targetId) {
                return applyOptimisticReaction(q, emoji);
            }
            return {
                ...q,
                answers: q.answers?.map(a => {
                    if (targetType === 'answer' && a.id === targetId) {
                        return applyOptimisticReaction(a, emoji);
                    }
                    return a;
                })
            };
        }));

        try {
            await qaService.toggleReaction({ targetType, targetId, emoji });
        } catch (err) {
            // Revert on error by refetching
            fetchQuestions();
            pushToast({ type: 'error', title: 'Lỗi reaction', message: err.message });
        }
    };

    const applyOptimisticReaction = (item, emoji) => {
        const myReactions = item.my_reactions || [];
        const reactions = [...(item.reactions || [])];
        const isRemoving = myReactions.includes(emoji);

        let newReactions;
        if (isRemoving) {
            newReactions = reactions.map(r =>
                r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1) } : r
            ).filter(r => r.count > 0);
        } else {
            const existing = reactions.find(r => r.emoji === emoji);
            if (existing) {
                newReactions = reactions.map(r =>
                    r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                );
            } else {
                newReactions = [...reactions, { emoji, count: 1 }];
            }
        }

        return {
            ...item,
            reactions: newReactions,
            my_reactions: isRemoving
                ? myReactions.filter(e => e !== emoji)
                : [...myReactions, emoji]
        };
    };

    const toggleExpanded = (qId) => {
        setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
    };

    if (loading) {
        return (
            <div className="qa-container">
                <div className="qa-loading">
                    <div className="qa-spinner" />
                    <span>Đang tải câu hỏi...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="qa-container">
                <div className="qa-error">
                    <p>❌ {error}</p>
                    <button className="qa-error-retry" onClick={fetchQuestions}>Thử lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="qa-container">
            {/* Composer */}
            <div className="qa-composer">
                {!showComposer ? (
                    <button className="qa-composer-toggle" onClick={() => setShowComposer(true)}>
                        <div className="avatar-mini">
                            {(user?.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span>Đặt câu hỏi...</span>
                    </button>
                ) : (
                    <form onSubmit={handlePostQuestion} className="qa-composer-form">
                        <input
                            type="text"
                            placeholder="Tiêu đề câu hỏi..."
                            value={newQuestion.title}
                            onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })}
                            className="qa-input"
                            autoFocus
                        />
                        <textarea
                            placeholder="Nội dung chi tiết..."
                            value={newQuestion.content}
                            onChange={e => setNewQuestion({ ...newQuestion, content: e.target.value })}
                            className="qa-input qa-textarea"
                            style={{ marginTop: 8 }}
                        />
                        <div className="qa-composer-actions">
                            <button
                                type="button"
                                className="qa-btn-ghost"
                                onClick={() => { setShowComposer(false); setNewQuestion({ title: '', content: '' }); }}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="qa-btn-primary"
                                disabled={posting || !newQuestion.title.trim() || !newQuestion.content.trim()}
                            >
                                {posting ? 'Đang gửi...' : 'Gửi câu hỏi'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Question List */}
            <div className="qa-questions-list">
                {questions.length === 0 ? (
                    <div className="qa-empty">
                        <div className="qa-empty-icon">💬</div>
                        <p>Chưa có câu hỏi nào.</p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>Hãy là người đầu tiên đặt câu hỏi!</p>
                    </div>
                ) : (
                    questions.map(q => {
                        const isExpanded = expandedQuestions[q.id];
                        const answerCount = q.answers?.length || 0;
                        const hasAccepted = q.answers?.some(a => a.is_accepted);

                        return (
                            <div key={q.id} className="qa-question-card">
                                {/* Question body */}
                                <div className="qa-question-body">
                                    <div className="qa-question-header">
                                        <div className={getFullAvatarClass(q.author_role)}>
                                            {(q.author_name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="qa-author-info">
                                            <div className="qa-author-name">
                                                {q.author_name}
                                                {q.author_role === 'instructor' && <span className="qa-badge qa-badge-instructor">GV</span>}
                                                {q.author_role === 'admin' && <span className="qa-badge qa-badge-admin">Admin</span>}
                                            </div>
                                            <div className="qa-time">{formatTimeAgo(q.created_at)}</div>
                                        </div>
                                    </div>
                                    <h4 className="qa-question-title">{q.title}</h4>
                                    <p className="qa-question-content">{q.content}</p>
                                </div>

                                {/* Footer: reactions + reply button */}
                                <div className="qa-footer">
                                    <ReactionBar
                                        reactions={q.reactions}
                                        myReactions={q.my_reactions}
                                        onToggle={handleToggleReaction}
                                        targetType="question"
                                        targetId={q.id}
                                    />
                                    <button
                                        className="qa-reply-toggle"
                                        onClick={() => {
                                            toggleExpanded(q.id);
                                            if (!isExpanded) {
                                                setReplyingTo(q.id);
                                            }
                                        }}
                                    >
                                        {answerCount > 0
                                            ? `${answerCount} trả lời${hasAccepted ? ' ✓' : ''}`
                                            : 'Trả lời'}
                                        {answerCount > 0 && (isExpanded ? ' ▲' : ' ▼')}
                                    </button>
                                </div>

                                {/* Answers */}
                                {(isExpanded || answerCount === 0) && answerCount > 0 && (
                                    <div className="qa-answers-section">
                                        <div className="qa-answer-thread">
                                            {q.answers.map(a => (
                                                <div key={a.id} className={`qa-answer-card ${a.is_accepted ? 'accepted' : ''}`}>
                                                    <div className="qa-answer-header">
                                                        <div className={getAvatarClass(a.author_role)}>
                                                            {(a.author_name || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="qa-author-name" style={{ fontSize: 12 }}>
                                                            {a.author_name}
                                                            {a.author_role === 'instructor' && <span className="qa-badge qa-badge-instructor">GV</span>}
                                                            {a.author_role === 'admin' && <span className="qa-badge qa-badge-admin">Admin</span>}
                                                        </span>
                                                        <span className="qa-time">{formatTimeAgo(a.created_at)}</span>
                                                        {a.is_accepted && (
                                                            <span className="qa-accepted-badge">✓ Đã duyệt</span>
                                                        )}
                                                    </div>
                                                    <p className="qa-answer-content">{a.content}</p>
                                                    <div className="qa-answer-footer">
                                                        <ReactionBar
                                                            reactions={a.reactions}
                                                            myReactions={a.my_reactions}
                                                            onToggle={handleToggleReaction}
                                                            targetType="answer"
                                                            targetId={a.id}
                                                        />
                                                        {(user?.id === q.author_id || user?.role === 'instructor' || user?.role === 'admin') && (
                                                            <button
                                                                className={`qa-accept-btn ${a.is_accepted ? 'unaccept' : 'accept'}`}
                                                                onClick={() => handleAcceptAnswer(a.id)}
                                                            >
                                                                {a.is_accepted ? 'Bỏ duyệt' : '✓ Duyệt'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Reply input */}
                                {replyingTo === q.id && (
                                    <div className="qa-reply-input-row">
                                        <input
                                            type="text"
                                            value={replyContent}
                                            onChange={e => setReplyContent(e.target.value)}
                                            placeholder="Viết câu trả lời..."
                                            onKeyDown={e => { if (e.key === 'Enter' && replyContent.trim()) handlePostAnswer(q.id); }}
                                            autoFocus
                                        />
                                        <button
                                            className="qa-reply-send-btn"
                                            onClick={() => handlePostAnswer(q.id)}
                                            disabled={!replyContent.trim()}
                                        >
                                            Gửi
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CourseQA;
