const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check');
    console.log('Successfully dropped sessions_status_check');
  } catch (err) {
    console.error('Error dropping constraint:', err.message);
  }
  process.exit(0);
}

fix();
