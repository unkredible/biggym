import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/account/password  { currentPassword?, newPassword }
 * Sets or changes the signed-in user's password. If a password already exists,
 * currentPassword must match.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const newPassword = body.newPassword ?? "";
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (user.passwordHash) {
    const ok = await verifyPassword(body.currentPassword ?? "", user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is wrong." },
        { status: 403 },
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  return NextResponse.json({ ok: true });
}
