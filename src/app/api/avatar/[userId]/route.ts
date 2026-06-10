import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { currentContext } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE = process.env.STORAGE_DIR ?? "/app/storage";
const AVATAR_DIR = path.join(STORAGE, "avatars");

/** GET — serve a user's profile photo (any signed-in user). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const ctx = await currentContext();
  if (!ctx) return new NextResponse(null, { status: 401 });

  const safe = params.userId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) return new NextResponse(null, { status: 400 });

  try {
    const [data, type] = await Promise.all([
      fs.readFile(path.join(AVATAR_DIR, `${safe}.bin`)),
      fs.readFile(path.join(AVATAR_DIR, `${safe}.type`), "utf8").catch(() => "image/jpeg"),
    ]);
    return new NextResponse(data, {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=300" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
