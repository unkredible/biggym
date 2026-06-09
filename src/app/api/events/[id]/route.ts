import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";
import { RECUR, canAdmin, sharedEventFields } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function adminGym() {
  const ctx = await currentContext();
  if (!ctx?.gymId || !canAdmin(ctx.role, ctx.isSuper)) return null;
  return ctx;
}

/** PATCH — edit the whole series (gym_admin, gym-scoped). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await adminGym();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const event = await prisma.event.findFirst({
    where: { id: params.id, gymId: ctx.gymId! },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });

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

  const s = await sharedEventFields(b, ctx.gymId!);
  if ("error" in s) return NextResponse.json({ error: s.error }, { status: 400 });

  await prisma.event.update({
    where: { id: params.id },
    data: {
      title,
      notes: b.notes ? String(b.notes).trim() || null : null,
      startsAt,
      endsAt,
      allDay: Boolean(b.allDay),
      recurrence: recurrence as "none" | "daily" | "weekly" | "monthly",
      recurUntil,
      capacity: s.capacity,
      audience: s.audience,
      trainerId: s.trainerId,
      locationId: s.locationId,
      locationText: s.locationText,
      plans: { set: s.planIds.map((id) => ({ id })) },
    },
  });
  return NextResponse.json({ ok: true });
}

/** DELETE — remove an event + its exceptions (gym_admin, gym-scoped). */
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
