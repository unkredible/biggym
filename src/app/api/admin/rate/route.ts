import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { setClientUnitPrice } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { cents?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  try {
    const cfg = await setClientUnitPrice(Number(body.cents));
    return NextResponse.json({ ok: true, cents: cfg.clientUnitPriceCents });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 400 },
    );
  }
}
