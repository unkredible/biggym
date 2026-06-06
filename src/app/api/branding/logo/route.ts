import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE = process.env.STORAGE_DIR ?? "/app/storage";
const LOGO_DIR = path.join(STORAGE, "logos");
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_BYTES = 2 * 1024 * 1024;

function safeId(id: string): string | null {
  return /^[a-z0-9]+$/i.test(id) ? id : null;
}

/** GET /api/branding/logo?g=<gymId> — public, serves the stored logo. */
export async function GET(req: NextRequest) {
  const g = safeId(req.nextUrl.searchParams.get("g") ?? "");
  if (!g) return new NextResponse(null, { status: 404 });
  try {
    const type = (await fs.readFile(path.join(LOGO_DIR, `${g}.type`), "utf8")).trim();
    const data = await fs.readFile(path.join(LOGO_DIR, `${g}.bin`));
    return new NextResponse(data, {
      headers: {
        "Content-Type": type || "application/octet-stream",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

/** POST /api/branding/logo — gym_admin uploads a logo (multipart "file"). */
export async function POST(req: NextRequest) {
  const ctx = await currentContext();
  if (!ctx?.gymId || ctx.role !== "gym_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "use PNG, JPG, WEBP or SVG" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "max 2 MB" }, { status: 400 });
  }

  await fs.mkdir(LOGO_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(LOGO_DIR, `${ctx.gymId}.bin`), buf);
  await fs.writeFile(path.join(LOGO_DIR, `${ctx.gymId}.type`), file.type);

  const url = `/api/branding/logo?g=${ctx.gymId}&v=${Date.now()}`;
  await prisma.gym.update({ where: { id: ctx.gymId }, data: { logoUrl: url } });
  return NextResponse.json({ ok: true, url });
}
