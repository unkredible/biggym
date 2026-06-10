import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE = process.env.STORAGE_DIR ?? "/app/storage";
const AVATAR_DIR = path.join(STORAGE, "avatars");
const MAX = 5 * 1024 * 1024; // 5 MB
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** POST — upload your own profile photo. */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (!TYPES.has(file.type)) return NextResponse.json({ error: "JPEG/PNG/WebP only" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "max 5 MB" }, { status: 400 });

  await fs.mkdir(AVATAR_DIR, { recursive: true });
  await fs.writeFile(
    path.join(AVATAR_DIR, `${ctx.userId}.bin`),
    Buffer.from(await file.arrayBuffer()),
  );
  await fs.writeFile(path.join(AVATAR_DIR, `${ctx.userId}.type`), file.type);

  await prisma.user.update({
    where: { id: ctx.userId },
    data: { image: `/api/avatar/${ctx.userId}` },
  });
  return NextResponse.json({ ok: true, url: `/api/avatar/${ctx.userId}` });
}

/** DELETE — remove your photo (back to the default avatar). */
export async function DELETE() {
  const ctx = await currentContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await fs.unlink(path.join(AVATAR_DIR, `${ctx.userId}.bin`)).catch(() => {});
  await fs.unlink(path.join(AVATAR_DIR, `${ctx.userId}.type`)).catch(() => {});
  await prisma.user.update({ where: { id: ctx.userId }, data: { image: null } });
  return NextResponse.json({ ok: true });
}
