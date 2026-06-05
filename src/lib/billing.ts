/**
 * Per-activated-client billing, aggregated.
 *
 * We never charge per client. Instead each activation writes a
 * BillableActivation row (with the rate snapshotted at that moment). Once a
 * month, billPeriod() sums each gym's unbilled activations into ONE Stripe
 * invoice item, which Stripe attaches to that gym's next subscription invoice
 * — so every gym gets a single invoice per period, not micro-charges.
 *
 * The per-client rate lives in our DB (PlatformConfig) so the superadmin can
 * change it any time without touching Stripe prices.
 */

import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export function currentPeriod(d = new Date()): string {
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

export async function getPlatformConfig() {
  return prisma.platformConfig.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
}

export async function setClientUnitPrice(cents: number) {
  if (!Number.isInteger(cents) || cents < 0 || cents > 100000) {
    throw new Error("Invalid price");
  }
  return prisma.platformConfig.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", clientUnitPriceCents: cents },
    update: { clientUnitPriceCents: cents },
  });
}

/** Set or clear a single gym's per-client rate override (null = platform default). */
export async function setGymUnitPrice(gymId: string, cents: number | null) {
  if (cents !== null && (!Number.isInteger(cents) || cents < 0 || cents > 100000)) {
    throw new Error("Invalid price");
  }
  return prisma.gym.update({
    where: { id: gymId },
    data: { clientUnitPriceCents: cents },
  });
}

/** The effective rate for a gym = its override, else the platform default. */
export async function effectiveRateCents(gym: {
  clientUnitPriceCents: number | null;
}): Promise<number> {
  if (gym.clientUnitPriceCents != null) return gym.clientUnitPriceCents;
  const cfg = await getPlatformConfig();
  return cfg.clientUnitPriceCents;
}

/**
 * Mark a client active and record exactly one billable activation (idempotent
 * on clientId). Returns true if a new activation was recorded.
 */
export async function recordActivation(
  gymId: string,
  clientId: string,
): Promise<boolean> {
  const existing = await prisma.billableActivation.findUnique({
    where: { clientId },
  });

  await prisma.client.update({
    where: { id: clientId },
    data: { onboardingStatus: "active", activatedAt: new Date() },
  });

  if (existing) return false;

  const cfg = await getPlatformConfig();
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { clientUnitPriceCents: true },
  });
  const rate = gym?.clientUnitPriceCents ?? cfg.clientUnitPriceCents;

  await prisma.billableActivation.create({
    data: {
      gymId,
      clientId,
      unitPriceCents: rate,
      currency: cfg.currency,
      periodMonth: currentPeriod(),
    },
  });
  return true;
}

export interface BillResult {
  gymId: string;
  gymName: string;
  count: number;
  amountCents: number;
  invoiceItemId?: string;
  skipped?: string;
}

/**
 * Aggregate all unbilled activations (optionally for a specific period) into
 * one Stripe invoice item per gym. Safe to run repeatedly — only unbilled
 * rows are processed.
 */
export async function billPeriod(period?: string): Promise<BillResult[]> {
  const where = {
    billedAt: null as Date | null,
    ...(period ? { periodMonth: period } : {}),
  };

  const gymsWithUsage = await prisma.billableActivation.groupBy({
    by: ["gymId", "currency"],
    where,
    _sum: { unitPriceCents: true },
    _count: { _all: true },
  });

  const stripe = getStripe();
  const results: BillResult[] = [];

  for (const row of gymsWithUsage) {
    const gym = await prisma.gym.findUnique({ where: { id: row.gymId } });
    if (!gym) continue;
    const amountCents = row._sum.unitPriceCents ?? 0;
    const count = row._count._all;
    const base: BillResult = {
      gymId: gym.id,
      gymName: gym.name,
      count,
      amountCents,
    };

    if (!gym.stripeCustomerId) {
      results.push({ ...base, skipped: "no stripe customer" });
      continue;
    }
    if (amountCents <= 0) {
      results.push({ ...base, skipped: "zero amount" });
      continue;
    }

    const item = await stripe.invoiceItems.create({
      customer: gym.stripeCustomerId,
      amount: amountCents,
      currency: row.currency,
      description: `Active clients (${count}) — ${period ?? "all unbilled"}`,
    });

    await prisma.billableActivation.updateMany({
      where: { ...where, gymId: gym.id, currency: row.currency },
      data: { billedAt: new Date(), stripeInvoiceItemId: item.id },
    });

    results.push({ ...base, invoiceItemId: item.id });
  }

  return results;
}
