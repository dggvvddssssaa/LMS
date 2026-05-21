const { z } = require('zod');

const setSettingSchema = z.object({
  key: z.string().min(1, 'Key không được để trống').max(255),
  value: z.any()
});

module.exports = { setSettingSchema };
