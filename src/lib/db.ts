/**
 * Prisma client singleton.
 *
 * Next.js hot-reloads in dev mode would otherwise create a new PrismaClient
 * on every reload, exhausting Postgres connections. The global-cached pattern
 * below is the official Prisma recommendation.
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
