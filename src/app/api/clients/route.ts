import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/clients — list clients for the signed-in user's gym (staff only). */
export async function GET() {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const clients = await prisma.client.findMany({
    where: { gymId: ctx.gymId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      onboardingStatus: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ clients });
}

/** POST /api/clients — create a client in the signed-in user's gym (staff). */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { fullName?: string; email?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const fullName = (body.fullName ?? "").trim();
  if (!fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  const client = await prisma.client.create({
    data: {
      gymId: ctx.gymId, // tenant scoping — never trust a gymId from the body
      fullName,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
    },
    select: { id: true, fullName: true },
  });
  return NextResponse.json({ client }, { status: 201 });
}
