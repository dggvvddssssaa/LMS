const createModelMock = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  upsert: jest.fn(),
});

const prismaMock = {
  $transaction: jest.fn((cb) => cb(prismaMock)),
  $queryRawUnsafe: jest.fn(),

  // ── Models matching schema @@map names ──
  user:                  createModelMock(),
  course:               createModelMock(),
  enrollment:           createModelMock(),
  section:              createModelMock(),
  lesson:               createModelMock(),
  lesson_progress:      createModelMock(),
  live_classes:         createModelMock(),
  materials:            createModelMock(),
  notifications:        createModelMock(),
  reviews:              createModelMock(),
  session_attendance:   createModelMock(),
  sessions:             createModelMock(),
  assignments:          createModelMock(),
  assignment_submissions: createModelMock(),
  categories:           createModelMock(),
  certificates:         createModelMock(),
  certificate_templates: createModelMock(),
  chapters:             createModelMock(),
  classes:              createModelMock(),
  course_answers:       createModelMock(),
  course_categories:    createModelMock(),
  course_materials:     createModelMock(),
  course_questions:     createModelMock(),
  course_qa_reactions:  createModelMock(),
  global_settings:      createModelMock(),
  messages:             createModelMock(),
  progress_tracking:    createModelMock(),
  rooms:                createModelMock(),
  audit_log:            createModelMock(),
  payments:             createModelMock(),

  // ── PascalCase aliases (Prisma auto-generates both) ──
  // Keep for backward compat with repositories using PascalCase
  User:       undefined, // filled below
  Course:     undefined,
  Enrollment: undefined,
  Section:    undefined,
  Lesson:     undefined,
  Payment:    undefined,
};

// Wire PascalCase aliases to the same mocks
prismaMock.User       = prismaMock.user;
prismaMock.Course     = prismaMock.course;
prismaMock.Enrollment = prismaMock.enrollment;
prismaMock.Section    = prismaMock.section;
prismaMock.Lesson     = prismaMock.lesson;
prismaMock.Payment    = prismaMock.payments;

module.exports = { PrismaClient: jest.fn(() => prismaMock) };
module.exports.prismaMock = prismaMock;
