import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentClient } from "@/lib/gym";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  const plan = client.planId
    ? await prisma.plan.findUnique({ where: { id: client.planId }, select: { name: true } })
    : null;

  return (
    <main>
      <h1>Il mio profilo</h1>

      <div className="card">
        <div className="row" style={{ gap: "0.9rem" }}>
          <span className="lr-icon" style={{ width: 56, height: 56, fontSize: "1.6rem", flex: "0 0 56px" }}>👤</span>
          <span>
            <strong style={{ fontSize: "1.15rem" }}>{client.fullName}</strong>
            <br />
            <span className="muted">{plan ? plan.name : "Nessun piano"}</span>
          </span>
        </div>
      </div>

      <div className="stat-tiles">
        <div className="tile"><div className="ic">🏅</div><div className="v">—</div><div className="lb">Livello</div></div>
        <div className="tile"><div className="ic">🔥</div><div className="v">—</div><div className="lb">Streak</div></div>
        <div className="tile"><div className="ic">🏆</div><div className="v">—</div><div className="lb">Obiettivi</div></div>
      </div>

      <h2>Traguardi</h2>
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>I tuoi badge appariranno qui man mano che ti alleni 🏆</p>
      </div>

      <div className="list" style={{ marginTop: "1.2rem" }}>
        <a className="list-row" href="/my/workouts">
          <span className="lr-icon">🏋️</span>
          <span>Le mie schede</span>
          <span className="lr-value lr-chev">→</span>
        </a>
        <a className="list-row" href="/settings">
          <span className="lr-icon">⚙️</span>
          <span>Impostazioni profilo</span>
          <span className="lr-value lr-chev">→</span>
        </a>
        <a className="list-row" href="/logout">
          <span className="lr-icon">🚪</span>
          <span>Esci</span>
          <span className="lr-value lr-chev">→</span>
        </a>
      </div>
    </main>
  );
}
