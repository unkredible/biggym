import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentClient } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/my/logs  { loadKg?, reps?, rpe?, note? } — the signed-in client logs a set. */
export async function POST(req: NextRequest) {
  const client = await currentClient();
  if (!client) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { loadKg?: number; reps?: number; rpe?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const log = await prisma.workoutLog.create({
    data: {
      clientId: client.id,
      loadKg: body.loadKg != null ? Number(body.loadKg) : null,
      reps: body.reps != null ? Number(body.reps) : null,
      rpe: body.rpe != null ? Number(body.rpe) : null,
      note: body.note?.trim() || null,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: log.id });
}
