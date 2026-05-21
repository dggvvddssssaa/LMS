const { z } = require('zod');

const notificationIdParams = z.object({
  id: z.string().regex(/^\d+$/, 'ID phải là số')
});

module.exports = { notificationIdParams };
