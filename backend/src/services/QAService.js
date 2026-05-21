const prisma = require('../config/prisma');

class QAService {
  async getQuestions(courseId, lessonId, userId) {
    const where = { course_id: Number(courseId) };
    if (lessonId) where.lesson_id = Number(lessonId);

    const questions = await prisma.course_questions.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, role: true } },
        lesson: { select: { title: true } },
        answers: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: [{ is_accepted: 'desc' }, { created_at: 'asc' }]
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Collect all question and answer IDs
    const questionIds = questions.map(q => q.id);
    const answerIds = questions.flatMap(q => q.answers.map(a => a.id));

    // Fetch all reactions in one query
    const allReactions = await prisma.course_qa_reactions.findMany({
      where: {
        OR: [
          { target_type: 'question', target_id: { in: questionIds } },
          { target_type: 'answer', target_id: { in: answerIds } }
        ]
      }
    });

    // Group reactions by target
    const reactionMap = {};
    for (const r of allReactions) {
      const key = `${r.target_type}_${r.target_id}`;
      if (!reactionMap[key]) reactionMap[key] = [];
      reactionMap[key].push(r);
    }

    const buildReactions = (targetType, targetId) => {
      const key = `${targetType}_${targetId}`;
      const reactions = reactionMap[key] || [];
      // Group by emoji and count
      const emojiCounts = {};
      const myReactions = [];
      for (const r of reactions) {
        emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
        if (userId && r.user_id === userId) {
          myReactions.push(r.emoji);
        }
      }
      return {
        reactions: Object.entries(emojiCounts).map(([emoji, count]) => ({ emoji, count })),
        my_reactions: myReactions
      };
    };

    return questions.map(q => {
      const qReactions = buildReactions('question', q.id);
      return {
        id: q.id,
        title: q.title,
        content: q.content,
        created_at: q.created_at,
        updated_at: q.updated_at,
        author_name: q.author?.name,
        author_role: q.author?.role,
        author_id: q.author?.id,
        lesson_title: q.lesson?.title,
        answer_count: q.answers.length,
        accepted_answer_count: q.answers.filter(a => a.is_accepted).length,
        reactions: qReactions.reactions,
        my_reactions: qReactions.my_reactions,
        answers: q.answers.map(a => {
          const aReactions = buildReactions('answer', a.id);
          return {
            id: a.id,
            content: a.content,
            is_accepted: a.is_accepted,
            created_at: a.created_at,
            author_name: a.author?.name,
            author_role: a.author?.role,
            author_id: a.author?.id,
            reactions: aReactions.reactions,
            my_reactions: aReactions.my_reactions
          };
        })
      };
    });
  }

  async postQuestion(userId, courseId, lessonId, title, content) {
    if (!title || !content) throw new Error('Title and content are required');

    return prisma.course_questions.create({
      data: {
        course_id: Number(courseId),
        lesson_id: lessonId ? Number(lessonId) : null,
        user_id: userId,
        title,
        content
      }
    });
  }

  async postAnswer(userId, questionId, content) {
    if (!content) throw new Error('Content is required');

    return prisma.course_answers.create({
      data: {
        question_id: Number(questionId),
        user_id: userId,
        content
      }
    });
  }

  async acceptAnswer(userId, answerId) {
    const answer = await prisma.course_answers.findUnique({
      where: { id: Number(answerId) },
      include: {
        question: {
          include: { course: { select: { instructor_id: true } } }
        }
      }
    });

    if (!answer) throw new Error('Answer not found');

    const questionAuthorId = answer.question?.user_id;
    const instructorId = answer.question?.course?.instructor_id;

    if (userId !== questionAuthorId && userId !== instructorId) {
      throw new Error('Not authorized to accept this answer');
    }

    return prisma.course_answers.update({
      where: { id: Number(answerId) },
      data: {
        is_accepted: !answer.is_accepted,
        updated_at: new Date()
      }
    });
  }

  async toggleReaction(userId, targetType, targetId, emoji) {
    const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉'];
    if (!ALLOWED_EMOJIS.includes(emoji)) {
      throw new Error('Invalid emoji');
    }
    if (!['question', 'answer'].includes(targetType)) {
      throw new Error('Invalid target type');
    }

    // Verify target exists
    if (targetType === 'question') {
      const q = await prisma.course_questions.findUnique({ where: { id: Number(targetId) } });
      if (!q) throw new Error('Question not found');
    } else {
      const a = await prisma.course_answers.findUnique({ where: { id: Number(targetId) } });
      if (!a) throw new Error('Answer not found');
    }

    // Check if reaction already exists
    const existing = await prisma.course_qa_reactions.findUnique({
      where: {
        target_type_target_id_user_id_emoji: {
          target_type: targetType,
          target_id: Number(targetId),
          user_id: userId,
          emoji
        }
      }
    });

    if (existing) {
      await prisma.course_qa_reactions.delete({ where: { id: existing.id } });
      return { added: false, emoji, target_type: targetType, target_id: Number(targetId) };
    } else {
      await prisma.course_qa_reactions.create({
        data: {
          target_type: targetType,
          target_id: Number(targetId),
          user_id: userId,
          emoji
        }
      });
      return { added: true, emoji, target_type: targetType, target_id: Number(targetId) };
    }
  }
}

module.exports = new QAService();
