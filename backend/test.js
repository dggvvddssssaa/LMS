const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.course.findMany().then(c => console.log(c.map(x => ({id: x.id, title: x.title, type: x.type})))).finally(() => prisma.$disconnect());
