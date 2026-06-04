import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + readiness probe.
 * Returns 200 only when both the process is up AND a trivial DB round-trip
 * succeeds. Used by the Docker HEALTHCHECK and by external uptime monitors.
 */
export async function GET() {
  const tenant = getTenant();
  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        tenant: { id: tenant.id, name: tenant.name },
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    tenant: { id: tenant.id, name: tenant.name, host: tenant.host },
    uptimeSec: Math.round(process.uptime()),
    dbLatencyMs: Date.now() - started,
  });
}
