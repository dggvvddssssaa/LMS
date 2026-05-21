const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(255),
  slug: z.string().min(1).max(255)
});

module.exports = { createCategorySchema };
