/**
 * DEV-ONLY quick login. Active only when DEV_QUICK_TOKEN is set.
 *
 * Seeds a "Demo Gym" with predefined users (gym admin, trainers, clients) and
 * returns the requested one so Auth.js can sign them in instantly. NEVER set
 * DEV_QUICK_TOKEN in a real production deployment — it bypasses authentication.
 */

import { prisma } from "@/lib/db";

export type DevAs =
  | "superadmin"
  | "palestra"
  | "personal1"
  | "personal2"
  | "client1"
  | "client2"
  | "client3";

export const DEV_ROLES: DevAs[] = [
  "superadmin",
  "palestra",
  "personal1",
  "personal2",
  "client1",
  "client2",
  "client3",
];

const DEMO_GYM_SLUG = "demo-gym";

function superEmail(): string {
  const first = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .filter(Boolean)[0];
  return first ?? "info@unkredible.com";
}

interface Spec {
  email: string;
  name: string;
  role: "gym_admin" | "trainer" | "client" | null; // null = no gym membership (platform super)
  isClient?: boolean;
}

function specFor(as: DevAs): Spec {
  switch (as) {
    case "superadmin":
      return { email: superEmail(), name: "Super Admin", role: null };
    case "palestra":
      return { email: "demo-admin@biggym.dev", name: "Demo Gym Admin", role: "gym_admin" };
    case "personal1":
      return { email: "trainer1@biggym.dev", name: "Personal 1", role: "trainer" };
    case "personal2":
      return { email: "trainer2@biggym.dev", name: "Personal 2", role: "trainer" };
    case "client1":
      return { email: "client1@biggym.dev", name: "Client 1", role: "client", isClient: true };
    case "client2":
      return { email: "client2@biggym.dev", name: "Client 2", role: "client", isClient: true };
    case "client3":
      return { email: "client3@biggym.dev", name: "Client 3", role: "client", isClient: true };
  }
}

async function ensureDemoGym() {
  return prisma.gym.upsert({
    where: { slug: DEMO_GYM_SLUG },
    create: {
      name: "Demo Gym",
      slug: DEMO_GYM_SLUG,
      status: "active",
      subscriptionStatus: "active",
      appName: "Demo Gym",
    },
    update: {},
  });
}

/** Seed (idempotently) and return the demo user for a role. */
export async function seedDevUser(as: DevAs) {
  if (!DEV_ROLES.includes(as)) return null;
  const spec = specFor(as);

  const user = await prisma.user.upsert({
    where: { email: spec.email },
    create: { email: spec.email, name: spec.name, emailVerified: new Date() },
    update: {},
  });

  if (spec.role) {
    const gym = await ensureDemoGym();
    const existing = await prisma.membership.findUnique({
      where: { userId: user.id },
    });
    if (!existing) {
      await prisma.membership.create({
        data: {
          gymId: gym.id,
          userId: user.id,
          role: spec.role,
          fullName: spec.name,
          email: spec.email,
        },
      });
    }
    if (spec.isClient) {
      let client = await prisma.client.findFirst({
        where: { gymId: gym.id, email: spec.email },
      });
      if (!client) {
        client = await prisma.client.create({
          data: {
            gymId: gym.id,
            userId: user.id,
            fullName: spec.name,
            email: spec.email,
            onboardingStatus: "active",
            activatedAt: new Date(),
          },
        });
      } else if (!client.userId) {
        await prisma.client.update({
          where: { id: client.id },
          data: { userId: user.id },
        });
      }
    }
  }

  return { id: user.id, email: user.email, name: user.name };
}
