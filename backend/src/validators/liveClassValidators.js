const { z } = require('zod');

const createLiveClassSchema = z.object({
  course_id: z.number().int().or(z.string()),
  schedule_config: z.any().optional(),
  total_sessions: z.number().int().min(0).optional(),
  max_students: z.number().int().min(0).optional(),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).optional()
});

const updateLiveClassSchema = z.object({
  schedule_config: z.any().optional(),
  total_sessions: z.number().int().min(0).optional(),
  max_students: z.number().int().min(0).optional(),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).optional()
});

module.exports = { createLiveClassSchema, updateLiveClassSchema };
