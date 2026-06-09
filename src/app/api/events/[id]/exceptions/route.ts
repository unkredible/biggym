import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";
import { canAdmin } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ownEvent(eventId: string) {
  const ctx = await currentContext();
  if (!ctx?.gymId || !canAdmin(ctx.role, ctx.isSuper)) return null;
  const event = await prisma.event.findFirst({
    where: { id: eventId, gymId: ctx.gymId },
    select: { id: true },
  });
  return event ? { ctx, gymId: ctx.gymId } : null;
}

/** POST — cancel or override a single occurrence (gym_admin). Upsert by date. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const own = await ownEvent(params.id);
  if (!own) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const originalDate = b.originalDate ? new Date(String(b.originalDate)) : null;
  if (!originalDate || isNaN(originalDate.getTime())) {
    return NextResponse.json({ error: "originalDate required." }, { status: 400 });
  }

  const canceled = Boolean(b.canceled);
  const startsAt = b.startsAt ? new Date(String(b.startsAt)) : null;
  const endsAt = b.endsAt ? new Date(String(b.endsAt)) : null;
  let capacity: number | null = null;
  if (!(b.capacity === "" || b.capacity == null)) {
    const n = Math.trunc(Number(b.capacity));
    if (!Number.isFinite(n) || n < 1) return NextResponse.json({ error: "Bad capacity." }, { status: 400 });
    capacity = n;
  }

  let locationId: string | null = b.locationId ? String(b.locationId) : null;
  let locationText: string | null = b.locationText ? String(b.locationText).trim() || null : null;
  if (locationId) {
    const loc = await prisma.gymLocation.findFirst({
      where: { id: locationId, gymId: own.gymId },
      select: { id: true },
    });
    if (!loc) return NextResponse.json({ error: "Invalid location." }, { status: 400 });
    locationText = null;
  }

  const fields = {
    canceled,
    title: b.title ? String(b.title).trim() || null : null,
    notes: b.notes ? String(b.notes).trim() || null : null,
    startsAt: startsAt && !isNaN(startsAt.getTime()) ? startsAt : null,
    endsAt: endsAt && !isNaN(endsAt.getTime()) ? endsAt : null,
    capacity,
    locationId,
    locationText,
  };

  const ex = await prisma.eventException.upsert({
    where: { eventId_originalDate: { eventId: params.id, originalDate } },
    create: { eventId: params.id, originalDate, ...fields },
    update: fields,
  });
  return NextResponse.json({ exception: ex });
}

/** DELETE — restore an occurrence (remove its exception). ?date=ISO */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const own = await ownEvent(params.id);
  if (!own) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const dateStr = new URL(req.url).searchParams.get("date");
  const originalDate = dateStr ? new Date(dateStr) : null;
  if (!originalDate || isNaN(originalDate.getTime())) {
    return NextResponse.json({ error: "date required." }, { status: 400 });
  }
  await prisma.eventException.deleteMany({
    where: { eventId: params.id, originalDate },
  });
  return NextResponse.json({ ok: true });
}
