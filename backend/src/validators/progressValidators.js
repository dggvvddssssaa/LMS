const { z } = require('zod');

const markCompleteSchema = z.object({
  courseId: z.number().int().or(z.string()),
  lessonId: z.number().int().or(z.string()),
  isCompleted: z.boolean()
});

const savePositionSchema = z.object({
  courseId: z.number().int().or(z.string()),
  lessonId: z.number().int().or(z.string()),
  lastPosition: z.number().int().min(0)
});

module.exports = { markCompleteSchema, savePositionSchema };
