import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE = process.env.STORAGE_DIR ?? "/app/storage";
const DIR = path.join(STORAGE, "branding");
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX = { logo: 2 * 1024 * 1024, banner: 5 * 1024 * 1024 };

function safeId(id: string): string | null {
  // cuid or UUID — letters, digits, hyphens. No slashes/dots → no traversal.
  return /^[a-z0-9-]+$/i.test(id) ? id : null;
}
function isKind(k: string): k is "logo" | "banner" {
  return k === "logo" || k === "banner";
}

/** GET /api/branding/<kind>?g=<gymId> — public, serves the stored image. */
export async function GET(
  req: NextRequest,
  { params }: { params: { kind: string } },
) {
  if (!isKind(params.kind)) return new NextResponse(null, { status: 404 });
  const g = safeId(req.nextUrl.searchParams.get("g") ?? "");
  if (!g) return new NextResponse(null, { status: 404 });
  try {
    const base = path.join(DIR, `${g}-${params.kind}`);
    const type = (await fs.readFile(`${base}.type`, "utf8")).trim();
    const data = await fs.readFile(`${base}.bin`);
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

/** POST /api/branding/<kind> — gym_admin uploads (multipart "file"). */
export async function POST(
  req: NextRequest,
  { params }: { params: { kind: string } },
) {
  if (!isKind(params.kind)) return NextResponse.json({ error: "bad kind" }, { status: 404 });
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
  if (file.size > MAX[params.kind]) {
    return NextResponse.json(
      { error: `max ${MAX[params.kind] / 1024 / 1024} MB` },
      { status: 400 },
    );
  }

  await fs.mkdir(DIR, { recursive: true });
  const base = path.join(DIR, `${ctx.gymId}-${params.kind}`);
  await fs.writeFile(`${base}.bin`, Buffer.from(await file.arrayBuffer()));
  await fs.writeFile(`${base}.type`, file.type);

  const url = `/api/branding/${params.kind}?g=${ctx.gymId}&v=${Date.now()}`;
  await prisma.gym.update({
    where: { id: ctx.gymId },
    data: params.kind === "logo" ? { logoUrl: url } : { bannerUrl: url },
  });
  return NextResponse.json({ ok: true, url });
}
