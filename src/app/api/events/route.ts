import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";
import { RECUR, canAdmin, sharedEventFields } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — list a gym's events with location/plan names + per-occurrence exceptions. */
export async function GET() {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const events = await prisma.event.findMany({
    where: { gymId: ctx.gymId },
    orderBy: { startsAt: "asc" },
    include: {
      location: { select: { name: true } },
      plan: { select: { name: true } },
      exceptions: true,
    },
  });
  return NextResponse.json({ events });
}

/** POST — create an event (gym_admin). */
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

  const title = String(b.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title required." }, { status: 400 });

  const startsAt = b.startsAt ? new Date(String(b.startsAt)) : null;
  if (!startsAt || isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Start required." }, { status: 400 });
  }
  const endsAt = b.endsAt ? new Date(String(b.endsAt)) : null;
  if (endsAt && isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "Bad end date." }, { status: 400 });
  }

  const recurrence = RECUR.has(String(b.recurrence)) ? String(b.recurrence) : "none";
  const recurUntil =
    recurrence !== "none" && b.recurUntil ? new Date(String(b.recurUntil)) : null;
  if (recurUntil && isNaN(recurUntil.getTime())) {
    return NextResponse.json({ error: "Bad repeat-until date." }, { status: 400 });
  }

  const s = await sharedEventFields(b, ctx.gymId);
  if ("error" in s) return NextResponse.json({ error: s.error }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      gymId: ctx.gymId,
      title,
      notes: b.notes ? String(b.notes).trim() || null : null,
      startsAt,
      endsAt,
      allDay: Boolean(b.allDay),
      recurrence: recurrence as "none" | "daily" | "weekly" | "monthly",
      recurUntil,
      capacity: s.capacity,
      audience: s.audience,
      planId: s.planId,
      locationId: s.locationId,
      locationText: s.locationText,
    },
  });
  return NextResponse.json({ event });
}
