const { z } = require('zod');

const createSessionSchema = z.object({
  liveClassId: z.number().int().optional(),
  live_class_id: z.number().int().optional(),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255),
  start_time: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Thời gian không hợp lệ')),
  end_time: z.string().optional().nullable(),
  teacher_id: z.number().int().optional(),
  join_open_minutes: z.number().int().min(0).max(1440).optional()
});

const updateSessionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'open', 'ongoing', 'ended', 'cancelled']).optional(),
  teacher_id: z.number().int().optional(),
  join_open_minutes: z.number().int().min(0).max(1440).optional(),
  recording_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

module.exports = { createSessionSchema, updateSessionSchema };
