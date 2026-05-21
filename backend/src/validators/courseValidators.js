const { z } = require('zod');

const createCourseSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự').max(255),
  description: z.string().optional().nullable(),
  thumbnail: z.string().url('Thumbnail phải là URL hợp lệ').optional().nullable(),
  type: z.enum(['video', 'live', 'hybrid']).optional(),
  price: z.number().min(0, 'Giá không được âm').optional(),
  is_published: z.boolean().optional(),
  sale_price: z.number().min(0).optional(),
  duration_total_minutes: z.number().int().min(0).optional(),
  video_count: z.number().int().min(0).optional(),
  what_you_will_learn: z.array(z.string()).optional(),
  slug: z.string().optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  full_description: z.string().optional().nullable(),
  promo_video_url: z.string().url().optional().nullable(),
  language: z.string().max(50).optional(),
  certificate_enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  level: z.string().max(20).optional(),
  categoryIds: z.array(z.number().int()).optional(),
  live_class_data: z.object({
    schedule_config: z.any().optional(),
    total_sessions: z.number().int().optional(),
    max_students: z.number().int().optional()
  }).optional()
});

const updateCourseSchema = createCourseSchema.partial();

const courseIdParams = z.object({
  id: z.string().regex(/^\d+$/, 'ID phải là số')
});

const courseFilters = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  type: z.string().optional(),
  is_published: z.string().optional(),
  instructor_id: z.string().optional()
});

module.exports = {
  createCourseSchema, updateCourseSchema,
  courseIdParams, courseFilters
};
