const request = require('supertest');

jest.mock('@prisma/client');
jest.mock('jsonwebtoken');
const { prismaMock } = require('@prisma/client');

const app = require('../src/app');
const jwt = require('jsonwebtoken');

const mockToken = 'mocked.jwt.token';

const mockTemplate = {
  id: 1,
  name: 'Test Certificate',
  type: 'completion',
  status: 'draft',
  layout_json: { title: 'Certificate' },
  background_url: null,
  logo_url: null,
  seal_url: null,
  signature_url: null,
  issuer_name: 'John Doe',
  issuer_title: 'Director',
  representative_name: null,
  representative_title: null,
  created_by: 1,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01')
};

describe('Certificate Template Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    jwt.verify.mockReturnValue({ id: 1, email: 'admin@test.com', role: 'admin' });
  });

  describe('GET /api/certificate-templates', () => {
    it('should return all templates', async () => {
      const templates = [mockTemplate, { ...mockTemplate, id: 2, name: 'Template 2' }];
      prismaMock.certificate_templates.findMany.mockResolvedValue(templates);

      const res = await request(app)
        .get('/api/certificate-templates')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/certificate-templates/:id', () => {
    it('should return a template by valid id', async () => {
      prismaMock.certificate_templates.findUnique.mockResolvedValue(mockTemplate);

      const res = await request(app)
        .get('/api/certificate-templates/1')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Certificate');
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app)
        .get('/api/certificate-templates/abc')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid template ID');
    });

    it('should return 404 for non-existent template', async () => {
      prismaMock.certificate_templates.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/certificate-templates/99999')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/certificate-templates', () => {
    it('should create a template with correct data', async () => {
      const created = { ...mockTemplate, id: 3, name: 'New Template' };
      prismaMock.certificate_templates.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/api/certificate-templates')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ name: 'New Template', type: 'completion', layout_json: { title: 'Cert' } });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Template');
    });
  });

  describe('PUT /api/certificate-templates/:id', () => {
    it('should update template fields', async () => {
      const updated = { ...mockTemplate, name: 'Updated Name' };
      prismaMock.certificate_templates.update.mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/certificate-templates/1')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent template', async () => {
      const prismaError = new Error('Record to update not found.');
      prismaError.code = 'P2025';
      prismaMock.certificate_templates.update.mockRejectedValue(prismaError);

      const res = await request(app)
        .put('/api/certificate-templates/99999')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid id', async () => {
      const res = await request(app)
        .put('/api/certificate-templates/abc')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/certificate-templates/:id', () => {
    it('should delete a template', async () => {
      prismaMock.certificate_templates.delete.mockResolvedValue(mockTemplate);

      const res = await request(app)
        .delete('/api/certificate-templates/1')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Deleted successfully');
    });

    it('should return 404 for non-existent template', async () => {
      const prismaError = new Error('Record to delete does not exist.');
      prismaError.code = 'P2025';
      prismaMock.certificate_templates.delete.mockRejectedValue(prismaError);

      const res = await request(app)
        .delete('/api/certificate-templates/99999')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/certificate-templates/:id/duplicate', () => {
    it('should duplicate a template with (Copy) suffix', async () => {
      const duplicated = { ...mockTemplate, id: 4, name: 'Test Certificate (Copy)', status: 'draft' };
      prismaMock.certificate_templates.findUnique.mockResolvedValue(mockTemplate);
      prismaMock.certificate_templates.create.mockResolvedValue(duplicated);

      const res = await request(app)
        .post('/api/certificate-templates/1/duplicate')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Certificate (Copy)');
    });

    it('should return 404 when duplicating non-existent template', async () => {
      prismaMock.certificate_templates.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/certificate-templates/99999/duplicate')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
