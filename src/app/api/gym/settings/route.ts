import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** POST /api/gym/settings { appName?, primaryColor?, accentColor?, logoUrl? } — gym_admin. */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: {
    appName?: string;
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (body.primaryColor && !HEX.test(body.primaryColor)) {
    return NextResponse.json({ error: "primaryColor must be #rrggbb" }, { status: 400 });
  }
  if (body.accentColor && !HEX.test(body.accentColor)) {
    return NextResponse.json({ error: "accentColor must be #rrggbb" }, { status: 400 });
  }

  await prisma.gym.update({
    where: { id: ctx.gymId },
    data: {
      appName: body.appName?.trim() || null,
      primaryColor: body.primaryColor || undefined,
      accentColor: body.accentColor || undefined,
      logoUrl: body.logoUrl?.trim() || null,
    },
  });
  return NextResponse.json({ ok: true });
}
