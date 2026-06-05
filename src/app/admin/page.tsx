import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getPlatformConfig, currentPeriod } from "@/lib/billing";
import AdminControls from "./AdminControls";
import GymRateForm from "./GymRateForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ctx = await requireSuperAdmin();
  if (!ctx) redirect("/dashboard");

  const period = currentPeriod();
  const [gyms, cfg, activeByGym, periodByGym, unbilledByGym] = await Promise.all([
    prisma.gym.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { clients: true, memberships: true } } },
    }),
    getPlatformConfig(),
    prisma.client.groupBy({
      by: ["gymId"],
      where: { onboardingStatus: "active" },
      _count: { _all: true },
    }),
    prisma.billableActivation.groupBy({
      by: ["gymId"],
      where: { periodMonth: period },
      _count: { _all: true },
      _sum: { unitPriceCents: true },
    }),
    prisma.billableActivation.groupBy({
      by: ["gymId"],
      where: { billedAt: null },
      _count: { _all: true },
      _sum: { unitPriceCents: true },
    }),
  ]);

  const active = new Map(activeByGym.map((r) => [r.gymId, r._count._all]));
  const periodCnt = new Map(periodByGym.map((r) => [r.gymId, r]));
  const unbilled = new Map(unbilledByGym.map((r) => [r.gymId, r]));

  const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  const totalUnbilled = unbilledByGym.reduce(
    (s, r) => s + (r._sum.unitPriceCents ?? 0),
    0,
  );

  return (
    <main>
      <div className="row spread">
        <h1>Platform admin</h1>
        <a href="/dashboard">← app</a>
      </div>
      <p className="muted">
        Period <code>{period}</code> · rate{" "}
        <strong>{eur(cfg.clientUnitPriceCents)}</strong> / activated client ·
        unbilled total <strong>{eur(totalUnbilled)}</strong>
      </p>

      <AdminControls
        rateCents={cfg.clientUnitPriceCents}
        period={period}
      />

      <h2>Gyms ({gyms.length})</h2>
      {gyms.map((g) => {
        const p = periodCnt.get(g.id);
        const u = unbilled.get(g.id);
        return (
          <div className="card" key={g.id}>
            <div className="row spread">
              <strong>{g.name}</strong>
              <span className="badge">{g.subscriptionStatus}</span>
            </div>
            <p className="muted" style={{ margin: "0.4rem 0 0" }}>
              <code>{g.slug}</code> · staff {g._count.memberships} · clients{" "}
              {g._count.clients} · active {active.get(g.id) ?? 0}
            </p>
            <p className="muted" style={{ margin: "0.2rem 0 0" }}>
              this period: {p?._count._all ?? 0} activations ·{" "}
              {eur(p?._sum.unitPriceCents ?? 0)} · unbilled{" "}
              {u?._count._all ?? 0} ({eur(u?._sum.unitPriceCents ?? 0)})
            </p>
            <p className="muted" style={{ margin: "0.2rem 0 0" }}>
              rate:{" "}
              <strong>
                {eur(g.clientUnitPriceCents ?? cfg.clientUnitPriceCents)}
              </strong>{" "}
              {g.clientUnitPriceCents == null ? "(platform default)" : "(custom)"}{" "}
              · stripe customer: <code>{g.stripeCustomerId ?? "—"}</code>
            </p>
            <GymRateForm
              gymId={g.id}
              overrideCents={g.clientUnitPriceCents}
              defaultCents={cfg.clientUnitPriceCents}
            />
          </div>
        );
      })}
    </main>
  );
}
