import { redirect } from "next/navigation";
import { currentClient } from "@/lib/gym";
import { prisma } from "@/lib/db";
import { clientCards } from "@/lib/cards";
import { IconDumbbell, IconDoc, IconCalendar } from "@/components/icons";
import MyTrainerSelect from "./MyTrainerSelect";

export const dynamic = "force-dynamic";

export default async function MyWorkoutsPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  const [{ current, archived }, trainers] = await Promise.all([
    clientCards(client.id),
    prisma.membership.findMany({
      where: { gymId: client.gymId, role: { in: ["trainer", "gym_admin"] }, active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, user: { select: { image: true } } },
    }),
  ]);

  const trainerOpts = trainers.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    image: t.user?.image ?? null,
  }));

  return (
    <main>
      <div className="section-hero">
        <span className="sh-ic"><IconDumbbell width={26} height={26} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="sh-t">I miei workout</div>
          <div className="sh-s">Schede e trainer del tuo percorso</div>
        </div>
        {archived.length > 0 && (
          <a className="sh-end iconbtn" href="/my/workouts/archive" title="Archivio schede">
            <IconDoc />
          </a>
        )}
      </div>

      <MyTrainerSelect trainers={trainerOpts} current={client.assignedTrainerId} />

      <div className="row spread" style={{ marginTop: "1.4rem" }}>
        <h2 style={{ margin: 0 }}>Schede attive</h2>
        {archived.length > 0 && (
          <a href="/my/workouts/archive" className="muted" style={{ fontSize: "0.85rem" }}>
            Archivio ({archived.length}) →
          </a>
        )}
      </div>

      {current.length === 0 ? (
        <p className="muted">Nessuna scheda. Il tuo trainer ne caricherà una.</p>
      ) : (
        <div className="list" style={{ marginTop: "0.7rem" }}>
          {current.map((d) => (
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

      <a href="/my/calendar" className="muted" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: "1.1rem", fontSize: "0.9rem" }}>
        <IconCalendar width={15} height={15} /> Prenota una classe →
      </a>
    </main>
  );
}
