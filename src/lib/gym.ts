/**
 * Gym (tenant) helpers: provisioning from a paid checkout, and resolving the
 * signed-in user's gym + role for tenant-scoped queries.
 */

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "gym";
}

const STAFF_ROLES = new Set(["super_admin", "gym_admin", "reception", "trainer"]);

export const ACTIVE_GYM_COOKIE = "biggym_gym";

export function isSuperEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const supers = (process.env.SUPERADMIN_EMAILS ?? "")
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(Boolean);
  return supers.includes(email.toLowerCase());
}

export interface Ctx {
  userId: string;
  email: string;
  gymId: string | null;
  role: string | null; // membership role for the ACTIVE gym
  isSuper: boolean; // platform owner (separate from gym role)
  membershipCount: number;
}

/**
 * Resolve the current session's ACTIVE gym + role. A user can belong to many
 * gyms; the active one is chosen by the biggym_gym cookie, else the first.
 * super_admin is a separate flag so a platform owner can still act as the
 * gym_admin of gyms they belong to.
 */
export async function currentContext(): Promise<Ctx | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;
  const email = session.user.email ?? "";

  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { gymId: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  const { cookies } = await import("next/headers");
  const activeId = cookies().get(ACTIVE_GYM_COOKIE)?.value;
  const active =
    memberships.find((m) => m.gymId === activeId) ?? memberships[0] ?? null;

  return {
    userId,
    email,
    gymId: active?.gymId ?? null,
    role: active?.role ?? null,
    isSuper: isSuperEmail(email),
    membershipCount: memberships.length,
  };
}

/** List the user's gyms (for the gym switcher). */
export async function listUserGyms(userId: string) {
  const ms = await prisma.membership.findMany({
    where: { userId },
    select: { gymId: true, role: true, gym: { select: { name: true, appName: true } } },
    orderBy: { createdAt: "asc" },
  });
  return ms.map((m) => ({
    gymId: m.gymId,
    role: m.role,
    name: m.gym.appName ?? m.gym.name,
  }));
}

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && STAFF_ROLES.has(role);
}

/** Resolve the Client record for a signed-in client user (or null). */
export async function currentClient() {
  const ctx = await currentContext();
  if (!ctx?.userId || !ctx.gymId) return null;
  return prisma.client.findFirst({
    where: { userId: ctx.userId, gymId: ctx.gymId },
  });
}

const SOON_MS = 8 * 60 * 60 * 1000; // "starting soon" window

export interface UpcomingBooking {
  id: string;
  title: string;
  when: Date;
  location: string | null;
  soon: boolean;
}

/** A client's future booked occurrences (cancelled dates are dropped entirely).
 *  Pass `withinMs` to limit how far ahead to look. Sorted soonest-first. */
export async function clientUpcomingBookings(
  clientId: string,
  withinMs?: number,
): Promise<UpcomingBooking[]> {
  const bookings = await prisma.eventBooking.findMany({
    where: { clientId },
    include: { event: { include: { exceptions: true, location: { select: { name: true } } } } },
  });
  const now = Date.now();
  const out: UpcomingBooking[] = [];
  for (const bk of bookings) {
    const ev = bk.event;
    const ex = ev.exceptions.find(
      (e) => new Date(e.originalDate).toISOString() === new Date(bk.occurrenceDate).toISOString(),
    );
    if (ex?.canceled) continue; // cancelled = gone, never shown to the client
    const when = ex?.startsAt ? new Date(ex.startsAt) : new Date(bk.occurrenceDate);
    const diff = when.getTime() - now;
    if (diff <= 0) continue; // future only
    if (withinMs != null && diff > withinMs) continue;
    out.push({
      id: bk.id,
      title: ex?.title ?? ev.title,
      when,
      location: ex?.locationText ?? ev.location?.name ?? ev.locationText ?? null,
      soon: diff <= SOON_MS,
    });
  }
  return out.sort((a, b) => a.when.getTime() - b.when.getTime());
}
