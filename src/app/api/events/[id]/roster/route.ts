import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";
import { textPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — attendee roster for one occurrence. Allowed for gym_admin/super or the
 *  event's linked trainer. ?date=ISO (defaults to the event start), ?format=pdf|json */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await currentContext();
  if (!ctx?.gymId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const event = await prisma.event.findFirst({
    where: { id: params.id, gymId: ctx.gymId },
    select: { id: true, title: true, trainerId: true, startsAt: true },
  });
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });

  const me = await prisma.membership.findFirst({
    where: { userId: ctx.userId, gymId: ctx.gymId },
    select: { id: true },
  });
  const allowed =
    ctx.isSuper ||
    ctx.role === "gym_admin" ||
    (!!event.trainerId && me?.id === event.trainerId);
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date");
  const occ = dateStr ? new Date(dateStr) : new Date(event.startsAt);
  if (isNaN(occ.getTime())) {
    return NextResponse.json({ error: "bad date" }, { status: 400 });
  }

  const bookings = await prisma.eventBooking.findMany({
    where: { eventId: event.id, occurrenceDate: occ },
    orderBy: { createdAt: "asc" },
    include: { client: { select: { fullName: true, email: true, phone: true } } },
  });

  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      event: { id: event.id, title: event.title },
      date: occ.toISOString(),
      attendees: bookings.map((b) => b.client),
    });
  }

  const dateLabel = occ.toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const lines: string[] = [
    `${dateLabel}  ·  ${bookings.length} attendee${bookings.length === 1 ? "" : "s"}`,
    "",
    ...bookings.map((b, i) => {
      const c = b.client;
      const extra = [c.phone, c.email].filter(Boolean).join("  ");
      return `${i + 1}. ${c.fullName}${extra ? "   —   " + extra : ""}`;
    }),
  ];
  if (bookings.length === 0) lines.push("No sign-ups yet.");

  const pdf = textPdf(event.title, lines);
  const safe = event.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "event";
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="roster-${safe}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
