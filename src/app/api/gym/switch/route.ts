import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ACTIVE_GYM_COOKIE } from "@/lib/gym";
import { cookieDomain } from "@/lib/host";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { gymId } — switch the active gym (must be a gym the user belongs to). */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { gymId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const gymId = body.gymId ?? "";
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, gymId },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "not a member of that gym" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACTIVE_GYM_COOKIE, gymId, {
    path: "/",
    domain: cookieDomain(),
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
