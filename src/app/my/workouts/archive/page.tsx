import { redirect } from "next/navigation";
import { currentClient } from "@/lib/gym";
import { clientCards } from "@/lib/cards";
import { IconDoc } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function WorkoutArchivePage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  const { archived } = await clientCards(client.id);

  return (
    <main>
      <div className="section-hero">
        <span className="sh-ic"><IconDoc width={26} height={26} /></span>
        <div>
          <div className="sh-t">Archivio schede</div>
          <div className="sh-s">Le schede più vecchie di 12 mesi vengono eliminate</div>
        </div>
        <a className="sh-end muted" href="/my/workouts" style={{ fontSize: "0.85rem" }}>← workout</a>
      </div>

      {archived.length === 0 ? (
        <p className="muted">Archivio vuoto.</p>
      ) : (
        <div className="list">
          {archived.map((d) => (
            <a className="list-row" key={d.id} href={`/api/client-docs/${d.id}`} target="_blank" rel="noreferrer">
              <span className="lr-icon"><IconDoc width={16} height={16} /></span>
              <span>{d.name}</span>
              <span className="lr-value">
                {new Date(d.createdAt).toLocaleDateString()}
                <span className="lr-chev"> ↓</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
