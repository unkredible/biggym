import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — list the gym's locations (gym_admin). */
export async function GET() {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const locations = await prisma.gymLocation.findMany({
    where: { gymId: ctx.gymId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ locations });
}

/** POST { name, addressLine, city?, phone? } — add a location (gym_admin). */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { name?: string; addressLine?: string; city?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  const addressLine = (body.addressLine ?? "").trim();
  if (!name || !addressLine) {
    return NextResponse.json({ error: "Name and address required." }, { status: 400 });
  }
  const location = await prisma.gymLocation.create({
    data: {
      gymId: ctx.gymId,
      name,
      addressLine,
      city: body.city?.trim() || null,
      phone: body.phone?.trim() || null,
    },
  });
  return NextResponse.json({ location });
}
