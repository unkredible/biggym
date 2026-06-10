import { redirect } from "next/navigation";
import { currentClient } from "@/lib/gym";
import { IconDumbbell, IconFlame, IconClock, IconChart } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  return (
    <main>
      <div className="section-hero">
        <span className="sh-ic"><IconChart width={26} height={26} /></span>
        <div>
          <div className="sh-t">Progressi</div>
          <div className="sh-s">Il riepilogo dei tuoi allenamenti, presto qui</div>
        </div>
      </div>

      <div className="stat-tiles">
        <div className="tile"><span className="ic blue"><IconDumbbell width={18} height={18} /></span><div className="v">—</div><div className="lb">Allenamenti</div></div>
        <div className="tile"><span className="ic coral"><IconFlame width={18} height={18} /></span><div className="v">—</div><div className="lb">Calorie</div></div>
        <div className="tile"><span className="ic cyan"><IconClock width={18} height={18} /></span><div className="v">—</div><div className="lb">Minuti</div></div>
      </div>

      <div className="card">
        <h3>In arrivo</h3>
        <p className="muted" style={{ margin: 0 }}>
          Grafici settimanali, focus muscolare e trend dei tuoi risultati.
        </p>
      </div>
    </main>
  );
}
