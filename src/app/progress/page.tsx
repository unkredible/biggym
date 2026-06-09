import { redirect } from "next/navigation";
import { currentClient } from "@/lib/gym";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  return (
    <main>
      <h1>Progressi</h1>
      <p className="muted">Il riepilogo dei tuoi allenamenti, presto qui 📈</p>

      <div className="stat-tiles">
        <div className="tile"><div className="ic">🏋️</div><div className="v">—</div><div className="lb">Allenamenti</div></div>
        <div className="tile"><div className="ic">🔥</div><div className="v">—</div><div className="lb">Calorie</div></div>
        <div className="tile"><div className="ic">⏱️</div><div className="v">—</div><div className="lb">Minuti</div></div>
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
