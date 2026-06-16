import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentClient } from "@/lib/gym";
import { IconCard } from "@/components/icons";

export const dynamic = "force-dynamic";

function euros(c: number | null) {
  return c == null ? null : (c / 100).toFixed(2);
}

export default async function MembershipPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  const [plan, allPlans] = await Promise.all([
    client.planId
      ? prisma.plan.findUnique({ where: { id: client.planId }, select: { name: true, priceCents: true } })
      : null,
    prisma.plan.findMany({
      where: { gymId: client.gymId, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, priceCents: true },
    }),
  ]);

  return (
    <main>
      <div className="section-hero">
        <span className="sh-ic"><IconCard width={26} height={26} /></span>
        <div>
          <div className="sh-t">Abbonamento</div>
          <div className="sh-s">Il tuo piano e i piani disponibili in palestra</div>
        </div>
      </div>

      <div className="hero-grad">
        <p className="eyebrow">Il tuo piano</p>
        <p className="font-display" style={{ fontSize: "2.2rem", lineHeight: 1, margin: "0.3rem 0 0", textTransform: "uppercase" }}>
          {plan ? plan.name : "Nessun piano"}
        </p>
        <p style={{ margin: "0.4rem 0 0", opacity: 0.9 }}>
          {plan?.priceCents != null ? `€${euros(plan.priceCents)} / mese` : "Contatta la reception per attivarne uno"}
        </p>
      </div>

      <h2>Piani della palestra</h2>
      {allPlans.length === 0 ? (
        <p className="muted">Nessun piano disponibile.</p>
      ) : (
        <div className="list">
          {allPlans.map((p) => (
            <div className="list-row" key={p.id}>
              <span className="lr-icon"><IconCard width={16} height={16} /></span>
              <span>
                <strong>{p.name}</strong>
                {p.id === client.planId && <span className="badge brand" style={{ marginLeft: "0.5rem" }}>attivo</span>}
              </span>
              <span className="lr-value">{p.priceCents != null ? `€${euros(p.priceCents)}/mese` : "—"}</span>
            </div>
          ))}
        </div>
      )}

      <p className="muted" style={{ marginTop: "1.2rem", fontSize: "0.88rem" }}>
        Per cambiare piano rivolgiti alla reception della tua palestra.
      </p>
    </main>
  );
}
