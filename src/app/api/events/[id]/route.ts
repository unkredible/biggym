import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function adminGym() {
  const ctx = await currentContext();
  if (!ctx?.gymId) return null;
  if (!(ctx.isSuper || ctx.role === "gym_admin")) return null;
  return ctx;
}

/** DELETE — remove an event (gym_admin, gym-scoped). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await adminGym();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const res = await prisma.event.deleteMany({
    where: { id: params.id, gymId: ctx.gymId! },
  });
  if (res.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
