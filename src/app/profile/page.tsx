import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentClient, currentContext } from "@/lib/gym";
import {
  IconFlame, IconTrophy, IconChart, IconDumbbell, IconSettings, IconLogout,
} from "@/components/icons";
import AvatarUpload from "./AvatarUpload";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [client, ctx] = await Promise.all([currentClient(), currentContext()]);
  if (!client || !ctx) redirect("/dashboard");

  const [plan, user] = await Promise.all([
    client.planId
      ? prisma.plan.findUnique({ where: { id: client.planId }, select: { name: true } })
      : null,
    prisma.user.findUnique({ where: { id: ctx.userId }, select: { image: true } }),
  ]);

  const memberSince = client.createdAt.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <main>
      {/* profile hero — avatar (tap to upload), name, level bar, gear */}
      <div className="section-hero" style={{ alignItems: "flex-start" }}>
        <AvatarUpload src={user?.image ?? null} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sh-t">{client.fullName}</div>
          <div className="sh-s" style={{ color: "var(--accent)" }}>
            {plan ? plan.name : "Nessun piano"} · Livello —
          </div>
          <div className="xpbar"><i style={{ width: "0%" }} /></div>
          <div className="sh-s">— / — XP</div>
        </div>
        <a className="sh-end iconbtn" href="/settings" aria-label="Impostazioni">
          <IconSettings />
        </a>
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

      <div className="card accent" style={{ marginTop: "1.2rem" }}>
        <p className="muted" style={{ margin: 0 }}>Membro da {memberSince}</p>
        <h3 style={{ margin: "0.2rem 0 0" }}>Continua così. I risultati arrivano. 💪</h3>
      </div>
    </main>
  );
}
