const { z } = require('zod');

const createAssignmentSchema = z.object({
  course_id: z.number().int().optional(),
  section_id: z.number().int().optional(),
  lesson_id: z.number().int().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  time_limit_minutes: z.number().int().min(1).nullable().optional(),
  kind: z.enum(['mcq', 'essay', 'code', 'file']).optional(),
  payload: z.any().optional(),
  score_max: z.number().int().min(1).optional(),
  assignment_scope: z.enum(['lesson', 'section', 'final']).optional(),
  pass_percent: z.number().int().min(0).max(100).optional()
});

const updateAssignmentSchema = createAssignmentSchema.partial();

const submitAssignmentSchema = z.object({
  answers: z.any().optional()
});

module.exports = { createAssignmentSchema, updateAssignmentSchema, submitAssignmentSchema };
