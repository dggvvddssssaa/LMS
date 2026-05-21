const { z } = require('zod');

const postQuestionSchema = z.object({
  courseId: z.number().int().or(z.string()),
  lessonId: z.number().int().optional().nullable(),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255),
  content: z.string().min(1, 'Nội dung không được để trống')
});

const postAnswerSchema = z.object({
  questionId: z.number().int().or(z.string()),
  content: z.string().min(1, 'Nội dung không được để trống')
});

const acceptAnswerParams = z.object({
  id: z.string().regex(/^\d+$/, 'ID phải là số')
});

const reactionSchema = z.object({
  targetType: z.enum(['question', 'answer']),
  targetId: z.number().int().positive().or(z.string().regex(/^\d+$/).transform(Number)),
  emoji: z.string().min(1).max(10)
});

module.exports = { postQuestionSchema, postAnswerSchema, acceptAnswerParams, reactionSchema };
