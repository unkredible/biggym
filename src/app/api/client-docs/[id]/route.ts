import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE = process.env.STORAGE_DIR ?? "/app/storage";
const DOC_DIR = path.join(STORAGE, "client-docs");

/** GET — download a client document. Allowed for gym staff or the owning client. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await currentContext();
  if (!ctx) return new NextResponse(null, { status: 401 });

  const doc = await prisma.clientDocument.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, contentType: true, gymId: true, client: { select: { userId: true } } },
  });
  if (!doc) return new NextResponse(null, { status: 404 });

  const staffOfGym = ctx.gymId === doc.gymId && isStaffRole(ctx.role);
  const isOwner = doc.client.userId === ctx.userId;
  if (!staffOfGym && !isOwner) return new NextResponse(null, { status: 403 });

  try {
    const data = await fs.readFile(path.join(DOC_DIR, `${doc.id}.bin`));
    return new NextResponse(data, {
      headers: {
        "Content-Type": doc.contentType || "application/pdf",
        "Content-Disposition": `inline; filename="${doc.name.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

/** DELETE — remove a document (gym staff only). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const res = await prisma.clientDocument.deleteMany({
    where: { id: params.id, gymId: ctx.gymId },
  });
  if (res.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  await fs.unlink(path.join(DOC_DIR, `${params.id}.bin`)).catch(() => {});
  return NextResponse.json({ ok: true });
}
