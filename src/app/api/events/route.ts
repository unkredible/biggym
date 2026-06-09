import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECUR = new Set(["none", "daily", "weekly", "monthly"]);

function canAdmin(role: string, isSuper: boolean) {
  return isSuper || role === "gym_admin";
}

/** GET — list a gym's events (any staff). */
export async function GET() {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const events = await prisma.event.findMany({
    where: { gymId: ctx.gymId },
    orderBy: { startsAt: "asc" },
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
    },
  });
  return NextResponse.json({ event });
}
