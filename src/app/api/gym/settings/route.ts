import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THEMES = new Set(["emerald", "crimson", "ocean", "sunset", "violet"]);
const MODES = new Set(["light", "dark"]);

/** POST /api/gym/settings { appName?, theme?, themeMode? } — gym_admin only. */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { appName?: string; theme?: string; themeMode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const data: { appName?: string | null; theme?: string; themeMode?: string } = {};
  if (body.appName !== undefined) data.appName = body.appName.trim() || null;
  if (body.theme !== undefined) {
    if (!THEMES.has(body.theme)) {
      return NextResponse.json({ error: "invalid theme" }, { status: 400 });
    }
    data.theme = body.theme;
  }
  if (body.themeMode !== undefined) {
    if (!MODES.has(body.themeMode)) {
      return NextResponse.json({ error: "invalid mode" }, { status: 400 });
    }
    data.themeMode = body.themeMode;
  }

  await prisma.gym.update({ where: { id: ctx.gymId }, data });
  return NextResponse.json({ ok: true });
}
