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

/** Ensure a unique slug by appending a short suffix on collision. */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.gym.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export interface ProvisionGymInput {
  gymName: string;
  ownerEmail: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: string | null;
}

/**
 * Create (or update) a gym + its owner User + gym_admin Membership after a
 * successful subscription. Idempotent on the owner email / stripe customer.
 */
export async function provisionGym(input: ProvisionGymInput) {
  const email = input.ownerEmail.toLowerCase();

  // Reuse an existing gym for this stripe customer if present.
  let gym = input.stripeCustomerId
    ? await prisma.gym.findUnique({
        where: { stripeCustomerId: input.stripeCustomerId },
      })
    : null;

  if (!gym) {
    gym = await prisma.gym.create({
      data: {
        name: input.gymName,
        slug: await uniqueSlug(input.gymName),
        status: "active",
        contactEmail: email,
        appName: input.gymName,
        stripeCustomerId: input.stripeCustomerId ?? undefined,
        stripeSubscriptionId: input.stripeSubscriptionId ?? undefined,
        plan: input.plan ?? undefined,
        subscriptionStatus: "active",
      },
    });
  } else {
    gym = await prisma.gym.update({
      where: { id: gym.id },
      data: {
        status: "active",
        subscriptionStatus: "active",
        stripeSubscriptionId: input.stripeSubscriptionId ?? gym.stripeSubscriptionId,
        plan: input.plan ?? gym.plan,
      },
    });
  }

  // Owner user + gym_admin membership.
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  await prisma.membership.upsert({
    where: { userId: user.id },
    create: {
      gymId: gym.id,
      userId: user.id,
      role: "gym_admin",
      fullName: input.gymName,
      email,
    },
    update: { gymId: gym.id, role: "gym_admin", active: true },
  });

  return { gym, user };
}

const STAFF_ROLES = new Set(["super_admin", "gym_admin", "reception", "trainer"]);

/**
 * Resolve the current session's gym + role. Throws-by-redirect should be done
 * by the caller; this just returns null when there is no usable membership.
 */
export async function currentContext() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const gymId = session.user.gymId ?? null;
  const role = session.user.role ?? null;
  return { userId: session.user.id, email: session.user.email ?? "", gymId, role };
}

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && STAFF_ROLES.has(role);
}
