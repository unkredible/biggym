import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";
import { canAdmin } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function priceOf(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const euros = Number(v);
  if (!Number.isFinite(euros) || euros < 0) return null;
  return Math.round(euros * 100);
}

/** GET — list a gym's plans (any staff). */
export async function GET() {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const plans = await prisma.plan.findMany({
    where: { gymId: ctx.gymId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, priceCents: true, active: true },
  });
  return NextResponse.json({ plans });
}

/** POST — create a plan (gym_admin). */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || !canAdmin(ctx.role, ctx.isSuper)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required." }, { status: 400 });

  const plan = await prisma.plan.create({
    data: { gymId: ctx.gymId, name, priceCents: priceOf(b.price) },
  });
  return NextResponse.json({ plan });
}
