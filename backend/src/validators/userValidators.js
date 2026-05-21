const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(255).optional(),
  role: z.enum(['student', 'teacher', 'instructor', 'admin']).optional()
});

const userIdParams = z.object({
  id: z.string().regex(/^\d+$/, 'ID phải là số')
});

module.exports = { createUserSchema, userIdParams };
