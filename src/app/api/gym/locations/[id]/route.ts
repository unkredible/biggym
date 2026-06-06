import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH { name?, addressLine?, city?, phone?, active? } — edit a location. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: {
    name?: string;
    addressLine?: string;
    city?: string;
    phone?: string;
    active?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.addressLine !== undefined) {
    if (!body.addressLine.trim()) return NextResponse.json({ error: "address required" }, { status: 400 });
    data.addressLine = body.addressLine.trim();
  }
  if (body.city !== undefined) data.city = body.city.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone.trim() || null;
  if (body.active !== undefined) data.active = !!body.active;

  const res = await prisma.gymLocation.updateMany({
    where: { id: params.id, gymId: ctx.gymId },
    data,
  });
  if (res.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

/** DELETE — remove a location (gym_admin, scoped to own gym). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // deleteMany with gymId guard prevents touching another gym's row.
  const res = await prisma.gymLocation.deleteMany({
    where: { id: params.id, gymId: ctx.gymId },
  });
  if (res.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
