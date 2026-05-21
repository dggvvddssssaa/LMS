const { z } = require('zod');

const createSectionSchema = z.object({
  course_id: z.number().int().or(z.string()),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255),
  order_index: z.number().int().min(0).optional()
});

const updateSectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  order_index: z.number().int().min(0).optional()
});

const reorderSectionsSchema = z.object({
  updates: z.array(z.object({
    id: z.number().int(),
    order_index: z.number().int().min(0)
  })).min(1, 'Phải có ít nhất 1 mục để sắp xếp')
});

module.exports = { createSectionSchema, updateSectionSchema, reorderSectionsSchema };
