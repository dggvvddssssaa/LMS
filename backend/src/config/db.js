/**
 * @deprecated This module is no longer used. All database access has been
 * migrated to Prisma Client (require('../config/prisma')).
 * 
 * Previously, this wrapper used prisma.$queryRawUnsafe() which caused
 * `integer = text` type casting bugs (PostgreSQL error 42883).
 * 
 * This file is kept temporarily for reference. Safe to delete.
 */
const prisma = require('./prisma');

module.exports = {
  prisma,
  pool: {
    connect: async () => {
      throw new Error('Direct pool usage is deprecated. Use Prisma instead.');
    }
  },
  query: async (text, params) => {
    console.warn('[DEPRECATED] db.query() called. Migrate to Prisma Client.');
    const rows = await prisma.$queryRawUnsafe(text, ...(params || []));
    return { rows };
  }
};
