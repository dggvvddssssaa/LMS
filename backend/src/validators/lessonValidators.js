const { z } = require('zod');

const createLessonSchema = z.object({
  section_id: z.number().int().or(z.string()),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255),
  content_type: z.enum(['video', 'article', 'quiz', 'assignment']).optional(),
  content_url: z.string().url().optional().nullable(),
  content_text: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  order_index: z.number().int().min(0).optional()
});

const updateLessonSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content_type: z.enum(['video', 'article', 'quiz', 'assignment']).optional(),
  content_url: z.string().url().optional().nullable(),
  content_text: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  order_index: z.number().int().min(0).optional(),
  section_id: z.number().int().optional(),
  is_free_preview: z.boolean().optional(),
  duration: z.number().int().min(0).optional()
});

const reorderLessonsSchema = z.object({
  updates: z.array(z.object({
    id: z.number().int(),
    order_index: z.number().int().min(0),
    section_id: z.number().int().optional()
  })).min(1)
});

module.exports = { createLessonSchema, updateLessonSchema, reorderLessonsSchema };
