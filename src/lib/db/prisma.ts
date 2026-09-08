import { PrismaClient } from '@prisma/client';

/**
 * Serverless-safe Prisma client singleton.
 *
 * Next.js hot-reloads modules in development, which would otherwise spawn
 * a new PrismaClient (and a new DB connection pool) on every reload. We
 * cache the instance on `globalThis` to avoid exhausting Neon's connection
 * limit both locally and across warm Vercel serverless invocations.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
