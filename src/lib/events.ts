import { prisma } from "@/lib/db";

export const RECUR = new Set(["none", "daily", "weekly", "monthly"]);

export function canAdmin(role: string | null, isSuper: boolean) {
  return isSuper || role === "gym_admin";
}

export type SharedFields = {
  capacity: number | null;
  audience: "all" | "plan";
  planIds: string[];
  trainerId: string | null;
  locationId: string | null;
  locationText: string | null;
};

/** Validate + normalise the audience/plans/trainer/location/capacity payload
 *  shared by event create + series edit. Returns `{ error }` on bad input. */
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
  let planIds: string[] = [];
  if (audience === "plan") {
    const raw = Array.isArray(b.planIds) ? b.planIds : [];
    planIds = [...new Set(raw.map((x) => String(x)).filter(Boolean))];
    if (planIds.length === 0) return { error: "Pick at least one plan." };
    const found = await prisma.plan.count({ where: { id: { in: planIds }, gymId } });
    if (found !== planIds.length) return { error: "Invalid plan." };
  }

  let trainerId: string | null = b.trainerId ? String(b.trainerId) : null;
  if (trainerId) {
    const t = await prisma.membership.findFirst({
      where: { id: trainerId, gymId, role: { in: ["trainer", "gym_admin"] } },
      select: { id: true },
    });
    if (!t) return { error: "Invalid trainer." };
  } else {
    trainerId = null;
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

  return { capacity, audience, planIds, trainerId, locationId, locationText };
}
