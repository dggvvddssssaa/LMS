const { z } = require('zod');

const enrollSchema = z.object({
  courseId: z.number().int().or(z.string().regex(/^\d+$/).transform(Number))
});

const checkoutSchema = z.object({
  courseId: z.number().int().or(z.string().regex(/^\d+$/).transform(Number))
});

const paymentStatusParams = z.object({
  transactionId: z.string().min(1, 'Transaction ID không được để trống')
});

module.exports = { enrollSchema, checkoutSchema, paymentStatusParams };
