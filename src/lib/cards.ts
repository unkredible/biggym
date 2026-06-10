/**
 * Workout-card retention. Cards older than 12 months are purged — unless the
 * client has no newer card (an old card that is still the only one on the
 * profile stays). The split feeds the "current vs archive" views.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";

const STORAGE = process.env.STORAGE_DIR ?? "/app/storage";
const DOC_DIR = path.join(STORAGE, "client-docs");
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export interface CardDoc {
  id: string;
  name: string;
  createdAt: Date;
}

/** Purge stale cards, then return { current, archived }.
 *  current = last 12 months (or the newest ones if everything is older);
 *  archived = the rest. */
export async function clientCards(clientId: string): Promise<{
  current: CardDoc[];
  archived: CardDoc[];
}> {
  const cutoff = new Date(Date.now() - YEAR_MS);
  const all = await prisma.clientDocument.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true },
  });

  const fresh = all.filter((d) => d.createdAt > cutoff);
  const stale = all.filter((d) => d.createdAt <= cutoff);

  // Retention: stale cards die only when a fresher card exists.
  if (fresh.length > 0 && stale.length > 0) {
    await prisma.clientDocument.deleteMany({
      where: { id: { in: stale.map((d) => d.id) } },
    });
    await Promise.all(
      stale.map((d) => fs.unlink(path.join(DOC_DIR, `${d.id}.bin`)).catch(() => {})),
    );
    return { current: fresh.slice(0, 3), archived: fresh.slice(3) };
  }

  const kept = fresh.length > 0 ? fresh : stale; // stale-only profiles keep theirs
  return { current: kept.slice(0, 3), archived: kept.slice(3) };
}
