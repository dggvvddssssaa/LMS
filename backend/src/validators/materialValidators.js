const { z } = require('zod');

const addMaterialSchema = z.object({
  course_id: z.number().int().or(z.string()),
  title: z.string().min(1).max(255),
  file_url: z.string().url('URL không hợp lệ'),
  file_type: z.string().max(50).optional()
});

const materialIdParams = z.object({
  id: z.string().regex(/^\d+$/, 'ID phải là số')
});

module.exports = { addMaterialSchema, materialIdParams };
