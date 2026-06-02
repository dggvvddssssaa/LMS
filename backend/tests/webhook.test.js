const request = require('supertest');

jest.mock('@prisma/client');
const { prismaMock } = require('@prisma/client');

const app = require('../src/app');

describe('Webhook API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SEPAY_WEBHOOK_API_KEY = 'test-webhook-key';
  });

  describe('POST /api/webhook/sepay', () => {
    it('should reject if SEPAY_WEBHOOK_API_KEY is not set in env', async () => {
      delete process.env.SEPAY_WEBHOOK_API_KEY;
      const res = await request(app)
        .post('/api/webhooks/sepay')
        .set('Authorization', 'Apikey test-webhook-key')
        .send({ transferType: 'in' });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/configuration error/i);
    });

    it('should reject request without Authorization header', async () => {
      const res = await request(app)
        .post('/api/webhooks/sepay')
        .send({ transferType: 'in' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with wrong Authorization header', async () => {
      const res = await request(app)
        .post('/api/webhooks/sepay')
        .set('Authorization', 'Apikey wrong-key')
        .send({ transferType: 'in' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should ignore outbound transaction with correct API key', async () => {
      const res = await request(app)
        .post('/api/webhooks/sepay')
        .set('Authorization', 'Apikey test-webhook-key')
        .send({ transferType: 'out' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Ignored outbound/i);
    });
  });
});
