import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = new Set(["gym_admin", "reception", "trainer"]);

async function adminGym() {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") return null;
  return ctx;
}

/** PATCH — edit a staff member (fullName, role/permission, active). gym_admin. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await adminGym();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const m = await prisma.membership.findFirst({
    where: { id: params.id, gymId: ctx.gymId! },
    select: { id: true, role: true },
  });
  if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (m.role === "client") {
    return NextResponse.json({ error: "edit clients from People" }, { status: 400 });
  }

  let b: { fullName?: string; role?: string; active?: boolean };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (b.fullName !== undefined) {
    const fn = b.fullName.trim();
    if (!fn) return NextResponse.json({ error: "name required" }, { status: 400 });
    data.fullName = fn;
  }
  if (b.role !== undefined) {
    if (!ROLES.has(b.role)) return NextResponse.json({ error: "invalid role" }, { status: 400 });
    data.role = b.role;
  }
  if (b.active !== undefined) data.active = !!b.active;

  await prisma.membership.update({ where: { id: m.id }, data });
  return NextResponse.json({ ok: true });
}

/** DELETE — remove a staff member (gym_admin; can't remove yourself). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await adminGym();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const m = await prisma.membership.findFirst({
    where: { id: params.id, gymId: ctx.gymId! },
    select: { id: true, userId: true },
  });
  if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (m.userId === ctx.userId) {
    return NextResponse.json({ error: "You can't remove yourself." }, { status: 400 });
  }
  await prisma.membership.delete({ where: { id: m.id } });
  return NextResponse.json({ ok: true });
}
