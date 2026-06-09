import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["lead", "consents", "anamnesis", "assigned", "active"]);

async function staffGym() {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) return null;
  return ctx;
}

/** PATCH — edit a client's details (staff, scoped to own gym). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await staffGym();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const client = await prisma.client.findFirst({
    where: { id: params.id, gymId: ctx.gymId! },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  const str = (k: string) => {
    if (b[k] !== undefined) data[k] = String(b[k]).trim() || null;
  };
  if (b.fullName !== undefined) {
    const fn = String(b.fullName).trim();
    if (!fn) return NextResponse.json({ error: "Name required." }, { status: 400 });
    data.fullName = fn;
  }
  str("email"); str("phone"); str("city"); str("fiscalCode"); str("addressLine");
  if (b.birthDate !== undefined) {
    data.birthDate = b.birthDate ? new Date(String(b.birthDate)) : null;
  }
  if (b.onboardingStatus !== undefined) {
    const s = String(b.onboardingStatus);
    if (!STATUSES.has(s)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
    data.onboardingStatus = s;
  }
  if (b.assignedTrainerId !== undefined) {
    const tid = b.assignedTrainerId ? String(b.assignedTrainerId) : null;
    if (tid) {
      const trainer = await prisma.membership.findFirst({
        where: { id: tid, gymId: ctx.gymId!, role: { in: ["trainer", "gym_admin"] } },
        select: { id: true },
      });
      if (!trainer) return NextResponse.json({ error: "invalid trainer" }, { status: 400 });
    }
    data.assignedTrainerId = tid;
  }
  if (b.planId !== undefined) {
    const pid = b.planId ? String(b.planId) : null;
    if (pid) {
      const plan = await prisma.plan.findFirst({
        where: { id: pid, gymId: ctx.gymId! },
        select: { id: true },
      });
      if (!plan) return NextResponse.json({ error: "invalid plan" }, { status: 400 });
    }
    data.planId = pid;
  }

  await prisma.client.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

/** DELETE — remove a client (staff, gym-scoped). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await staffGym();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const res = await prisma.client.deleteMany({
    where: { id: params.id, gymId: ctx.gymId! },
  });
  if (res.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
