import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentClient } from "@/lib/gym";
import {
  IconUser, IconFlame, IconTrophy, IconChart, IconDumbbell, IconSettings, IconLogout,
} from "@/components/icons";

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
          <span className="lr-icon" style={{ width: 56, height: 56, flex: "0 0 56px" }}><IconUser width={26} height={26} /></span>
          <span>
            <strong style={{ fontSize: "1.15rem" }}>{client.fullName}</strong>
            <br />
            <span className="muted">{plan ? plan.name : "Nessun piano"}</span>
          </span>
        </div>
      </div>

      <div className="stat-tiles">
        <div className="tile"><span className="ic blue"><IconChart width={18} height={18} /></span><div className="v">—</div><div className="lb">Livello</div></div>
        <div className="tile"><span className="ic coral"><IconFlame width={18} height={18} /></span><div className="v">—</div><div className="lb">Streak</div></div>
        <div className="tile"><span className="ic cyan"><IconTrophy width={18} height={18} /></span><div className="v">—</div><div className="lb">Obiettivi</div></div>
      </div>

      <h2>Traguardi</h2>
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>I tuoi badge appariranno qui man mano che ti alleni 🏆</p>
      </div>

      <div className="list" style={{ marginTop: "1.2rem" }}>
        <a className="list-row" href="/my/workouts">
          <span className="lr-icon"><IconDumbbell width={16} height={16} /></span>
          <span>Le mie schede</span>
          <span className="lr-value lr-chev">→</span>
        </a>
        <a className="list-row" href="/settings">
          <span className="lr-icon"><IconSettings width={16} height={16} /></span>
          <span>Impostazioni profilo</span>
          <span className="lr-value lr-chev">→</span>
        </a>
        <a className="list-row" href="/logout">
          <span className="lr-icon"><IconLogout width={16} height={16} /></span>
          <span>Esci</span>
          <span className="lr-value lr-chev">→</span>
        </a>
      </div>
    </main>
  );
}
