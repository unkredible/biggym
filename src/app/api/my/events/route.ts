import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentClient } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — events of the client's gym + booking counts + this client's bookings. */
export async function GET() {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [events, counts, mine] = await Promise.all([
    prisma.event.findMany({
      where: { gymId: client.gymId },
      orderBy: { startsAt: "asc" },
      include: {
        location: { select: { name: true } },
        plans: { select: { id: true, name: true } },
        exceptions: true,
      },
    }),
    prisma.eventBooking.groupBy({
      by: ["eventId", "occurrenceDate"],
      where: { event: { gymId: client.gymId } },
      _count: { _all: true },
    }),
    prisma.eventBooking.findMany({
      where: { clientId: client.id },
      select: { eventId: true, occurrenceDate: true },
    }),
  ]);

  return NextResponse.json({
    events,
    counts: counts.map((c) => ({
      eventId: c.eventId,
      occurrenceDate: c.occurrenceDate,
      count: c._count._all,
    })),
    mine,
    planId: client.planId,
  });
}
