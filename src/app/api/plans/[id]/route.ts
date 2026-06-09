import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";
import { canAdmin } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function adminGym() {
  const ctx = await currentContext();
  if (!ctx?.gymId || !canAdmin(ctx.role, ctx.isSuper)) return null;
  return ctx;
}

/** PATCH — rename / reprice / (de)activate a plan (gym_admin). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await adminGym();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const plan = await prisma.plan.findFirst({
    where: { id: params.id, gymId: ctx.gymId! },
    select: { id: true },
  });
  if (!plan) return NextResponse.json({ error: "not found" }, { status: 404 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (b.name !== undefined) {
    const n = String(b.name).trim();
    if (!n) return NextResponse.json({ error: "Name required." }, { status: 400 });
    data.name = n;
  }
  if (b.price !== undefined) {
    if (b.price === "" || b.price == null) {
      data.priceCents = null;
    } else {
      const euros = Number(b.price);
      if (!Number.isFinite(euros) || euros < 0) {
        return NextResponse.json({ error: "Bad price." }, { status: 400 });
      }
      data.priceCents = Math.round(euros * 100);
    }
  }
  if (b.active !== undefined) data.active = Boolean(b.active);

  await prisma.plan.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

/** DELETE — remove a plan (gym_admin). Clients/events referencing it are
 *  detached via onDelete: SetNull. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await adminGym();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const res = await prisma.plan.deleteMany({
    where: { id: params.id, gymId: ctx.gymId! },
  });
  if (res.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
