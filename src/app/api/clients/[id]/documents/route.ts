import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";
import { clientCards } from "@/lib/cards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE = process.env.STORAGE_DIR ?? "/app/storage";
const DOC_DIR = path.join(STORAGE, "client-docs");
const MAX = 15 * 1024 * 1024; // 15 MB

async function staffClient(clientId: string) {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) return null;
  const client = await prisma.client.findFirst({
    where: { id: clientId, gymId: ctx.gymId },
    select: { id: true, gymId: true },
  });
  return client ? { ctx, client } : null;
}

/** GET — list a client's documents (staff). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ok = await staffClient(params.id);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await clientCards(params.id); // applies the 12-month retention policy
  const documents = await prisma.clientDocument.findMany({
    where: { clientId: params.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, contentType: true, createdAt: true },
  });
  return NextResponse.json({ documents });
}

/** POST — upload a PDF workout card for a client (staff). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ok = await staffClient(params.id);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDF only" }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: "max 15 MB" }, { status: 400 });
  }

  const doc = await prisma.clientDocument.create({
    data: {
      gymId: ok.client.gymId,
      clientId: params.id,
      name: file.name || "workout.pdf",
      contentType: "application/pdf",
    },
  });

  await fs.mkdir(DOC_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DOC_DIR, `${doc.id}.bin`),
    Buffer.from(await file.arrayBuffer()),
  );

  return NextResponse.json({ ok: true, id: doc.id });
}
