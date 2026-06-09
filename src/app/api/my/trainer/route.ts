import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentClient } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — the client picks (or clears) their own assigned trainer. */
export async function POST(req: NextRequest) {
  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const tid = b.trainerId ? String(b.trainerId) : null;
  if (tid) {
    const trainer = await prisma.membership.findFirst({
      where: { id: tid, gymId: client.gymId, role: { in: ["trainer", "gym_admin"] }, active: true },
      select: { id: true },
    });
    if (!trainer) return NextResponse.json({ error: "invalid trainer" }, { status: 400 });
  }

  await prisma.client.update({
    where: { id: client.id },
    data: { assignedTrainerId: tid },
  });
  return NextResponse.json({ ok: true });
}
