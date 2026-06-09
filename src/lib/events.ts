import { prisma } from "@/lib/db";

export const RECUR = new Set(["none", "daily", "weekly", "monthly"]);

export function canAdmin(role: string | null, isSuper: boolean) {
  return isSuper || role === "gym_admin";
}

export type SharedFields = {
  capacity: number | null;
  audience: "all" | "plan";
  planId: string | null;
  locationId: string | null;
  locationText: string | null;
};

/** Validate + normalise the audience/plan/location/capacity payload shared by
 *  event create + series edit. Returns `{ error }` on bad input. */
export async function sharedEventFields(
  b: Record<string, unknown>,
  gymId: string,
): Promise<SharedFields | { error: string }> {
  let capacity: number | null = null;
  if (!(b.capacity === "" || b.capacity == null)) {
    const n = Math.trunc(Number(b.capacity));
    if (!Number.isFinite(n) || n < 1) return { error: "Bad capacity." };
    capacity = n;
  }

  const audience = b.audience === "plan" ? "plan" : "all";
  let planId: string | null = audience === "plan" && b.planId ? String(b.planId) : null;
  if (audience === "plan") {
    if (!planId) return { error: "Pick a plan for this audience." };
    const plan = await prisma.plan.findFirst({ where: { id: planId, gymId }, select: { id: true } });
    if (!plan) return { error: "Invalid plan." };
  } else {
    planId = null;
  }

  const locationId: string | null = b.locationId ? String(b.locationId) : null;
  let locationText: string | null = b.locationText ? String(b.locationText).trim() || null : null;
  if (locationId) {
    const loc = await prisma.gymLocation.findFirst({
      where: { id: locationId, gymId },
      select: { id: true },
    });
    if (!loc) return { error: "Invalid location." };
    locationText = null; // a real location wins over free text
  }

  return { capacity, audience, planId, locationId, locationText };
}
