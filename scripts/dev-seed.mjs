/**
 * Local-dev seed: one gym, one admin, one trainer, one client (with login),
 * plans, a couple of events and a booking — enough to review every client
 * screen. Idempotent-ish: wipes and re-creates the dev gym by slug.
 *
 *   node scripts/dev-seed.mjs
 *
 * Logins (password login on http://app.localhost:3000/login):
 *   admin@dev.local  / devdev1  (gym_admin)
 *   client@dev.local / devdev1  (client "Alex Johnson")
 */
import { PrismaClient } from "@prisma/client";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hash(plain) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function upsertUser(email, name, pwd) {
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash: await hash(pwd), name },
    create: { email, name, passwordHash: await hash(pwd), emailVerified: new Date() },
  });
}

const at = (daysAhead, h, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(h, m, 0, 0);
  return d;
};

async function main() {
  const old = await prisma.gym.findUnique({ where: { slug: "devgym" } });
  if (old) await prisma.gym.delete({ where: { id: old.id } });

  const gym = await prisma.gym.create({
    data: { name: "Dev Gym", slug: "devgym", status: "active", subscriptionStatus: "active" },
  });

  const admin = await upsertUser("admin@dev.local", "Ada Admin", "devdev1");
  const trainer = await upsertUser("trainer@dev.local", "Tia Trainer", "devdev1");
  const clientU = await upsertUser("client@dev.local", "Alex Johnson", "devdev1");

  const mkMember = (u, role, fullName) =>
    prisma.membership.upsert({
      where: { userId_gymId: { userId: u.id, gymId: gym.id } },
      update: { role, fullName },
      create: { gymId: gym.id, userId: u.id, role, fullName, email: u.email },
    });
  await mkMember(admin, "gym_admin", "Ada Admin");
  const trainerM = await mkMember(trainer, "trainer", "Tia Trainer");
  await mkMember(clientU, "client", "Alex Johnson");

  const loc = await prisma.gymLocation.create({
    data: { gymId: gym.id, name: "Sede Centro", addressLine: "Via Roma 1", city: "Torino" },
  });

  const [base, premium] = await Promise.all([
    prisma.plan.create({ data: { gymId: gym.id, name: "Base", priceCents: 2900 } }),
    prisma.plan.create({ data: { gymId: gym.id, name: "Premium", priceCents: 4900 } }),
  ]);

  const client = await prisma.client.create({
    data: {
      gymId: gym.id,
      userId: clientU.id,
      fullName: "Alex Johnson",
      email: "client@dev.local",
      onboardingStatus: "active",
      planId: premium.id,
      assignedTrainerId: trainerM.id,
    },
  });

  const spin = await prisma.event.create({
    data: {
      gymId: gym.id, title: "Spin Class", notes: "Porta la borraccia",
      startsAt: at(0, new Date().getHours() + 2), recurrence: "weekly",
      capacity: 12, audience: "all", locationId: loc.id, trainerId: trainerM.id,
    },
  });
  await prisma.event.create({
    data: {
      gymId: gym.id, title: "HIIT Premium", startsAt: at(1, 18, 30), recurrence: "weekly",
      capacity: 8, audience: "plan", locationText: "Sala 2",
      plans: { connect: [{ id: premium.id }] },
    },
  });
  await prisma.event.create({
    data: { gymId: gym.id, title: "Open Day", startsAt: at(3, 10), allDay: true, audience: "all" },
  });

  await prisma.eventBooking.create({
    data: { eventId: spin.id, clientId: client.id, occurrenceDate: spin.startsAt },
  });

  console.log("seeded. logins → admin@dev.local / client@dev.local  (pwd: devdev1)");
}

main().finally(() => prisma.$disconnect());
