const prismaMock = {
  $transaction: jest.fn((cb) => cb(prismaMock)),
  $queryRawUnsafe: jest.fn(),
  user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  course: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  enrollment: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  section: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
  lesson: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
  session: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
  material: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
  certificate: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
  assignment: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  category: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
  payment: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  progress: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
  notification: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
  live_classes: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  course_questions: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  course_answers: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  course_categories: { create: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn() },
  global_settings: { findMany: jest.fn() },
  certificate_templates: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

module.exports = { PrismaClient: jest.fn(() => prismaMock) };
module.exports.prismaMock = prismaMock;
