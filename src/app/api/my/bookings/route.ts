import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentClient } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function parse(req: NextRequest) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return null;
  }
  const eventId = b.eventId ? String(b.eventId) : "";
  const occ = b.occurrenceDate ? new Date(String(b.occurrenceDate)) : null;
  if (!eventId || !occ || isNaN(occ.getTime())) return null;
  return { eventId, occ };
}

/** POST — book one occurrence. Enforces plan audience + capacity. */
export async function POST(req: NextRequest) {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const p = await parse(req);
  if (!p) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const event = await prisma.event.findFirst({
    where: { id: p.eventId, gymId: client.gymId },
    include: { exceptions: true, plans: { select: { id: true } } },
  });
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ex = event.exceptions.find(
    (e) => new Date(e.originalDate).toISOString() === p.occ.toISOString(),
  );
  if (ex?.canceled) {
    return NextResponse.json({ error: "This date was cancelled." }, { status: 409 });
  }

  // Audience: plan-restricted events require the client to hold one of the
  // linked plans.
  if (event.audience === "plan") {
    const ok = client.planId != null && event.plans.some((pl) => pl.id === client.planId);
    if (!ok) {
      return NextResponse.json(
        { error: "Your plan doesn't include this event." },
        { status: 403 },
      );
    }
  }

  // Capacity (per-occurrence override wins).
  const cap = ex?.capacity ?? event.capacity;
  if (cap != null) {
    const taken = await prisma.eventBooking.count({
      where: { eventId: event.id, occurrenceDate: p.occ },
    });
    const alreadyMine = await prisma.eventBooking.findUnique({
      where: {
        eventId_occurrenceDate_clientId: {
          eventId: event.id,
          occurrenceDate: p.occ,
          clientId: client.id,
        },
      },
      select: { id: true },
    });
    if (!alreadyMine && taken >= cap) {
      return NextResponse.json({ error: "This session is full." }, { status: 409 });
    }
  }

  try {
    await prisma.eventBooking.create({
      data: { eventId: event.id, occurrenceDate: p.occ, clientId: client.id },
    });
  } catch {
    // unique violation = already booked; treat as success (idempotent).
  }
  return NextResponse.json({ ok: true });
}

/** DELETE — cancel the client's own booking for an occurrence. */
export async function DELETE(req: NextRequest) {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const p = await parse(req);
  if (!p) return NextResponse.json({ error: "bad request" }, { status: 400 });

  await prisma.eventBooking.deleteMany({
    where: { eventId: p.eventId, occurrenceDate: p.occ, clientId: client.id },
  });
  return NextResponse.json({ ok: true });
}
