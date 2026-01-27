import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // Use Accelerate extension if PRISMA_ACCELERATE_URL is set
  // This provides connection pooling for serverless environments
  // Vercel locks DATABASE_URL, so we use a separate env var for Accelerate
  // withAccelerate() automatically reads from PRISMA_ACCELERATE_URL env var
  if (process.env.PRISMA_ACCELERATE_URL) {
    return baseClient.$extends(withAccelerate());
  }

  return baseClient;
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

