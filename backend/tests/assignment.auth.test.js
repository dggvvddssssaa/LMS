const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client');
const { prismaMock } = require('@prisma/client');

const app = require('../src/app');

describe('Assignment Authorization', () => {
  let studentToken, instructorToken;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    
    studentToken = jwt.sign({ id: 1, email: 'student@test.com', role: 'student' }, process.env.JWT_SECRET);
    instructorToken = jwt.sign({ id: 2, email: 'instructor@test.com', role: 'instructor' }, process.env.JWT_SECRET);
  });

  describe('GET /api/assignments/course/:courseId/final', () => {
    it('should allow student if enrolled', async () => {
      // Mock enrollment check
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: 1, status: 'active', student_id: 1, course_id: 100 });
      
      // Mock assignment fetch (assuming AssignmentRepository will also use Prisma but we just care about the middleware passing)
      prismaMock.assignments.findFirst.mockResolvedValue({ id: 50, course_id: 100, assignment_scope: 'final' });

      const res = await request(app)
        .get('/api/assignments/course/100/final')
        .set('Authorization', `Bearer ${studentToken}`);

      // Should not be 403. Might be 404 or 200 depending on mock exact match for the repo call
      expect(res.statusCode).not.toBe(403);
    });

    it('should deny student if not enrolled', async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/assignments/course/100/final')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not enrolled/i);
    });

    it('should deny instructor if they do not own the course', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: 100, instructor_id: 99 }); // another instructor

      const res = await request(app)
        .get('/api/assignments/course/100/final')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/do not own/i);
    });
  });
});
