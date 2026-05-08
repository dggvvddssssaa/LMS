require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');
console.log('PrismaClient loaded');

try {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
  console.log('PrismaClient created');

  prisma.user.findFirst()
    .then(u => {
      console.log('First user:', u?.email);
    })
    .catch(e => {
      console.log('Query error:', e.message);
    })
    .finally(() => {
      prisma.$disconnect();
      process.exit(0);
    });
} catch(e) {
  console.log('Constructor error:', e.message);
  process.exit(1);
}
