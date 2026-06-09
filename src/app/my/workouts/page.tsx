import { redirect } from "next/navigation";
import { currentClient } from "@/lib/gym";
import { prisma } from "@/lib/db";
import MyTrainerSelect from "./MyTrainerSelect";

export const dynamic = "force-dynamic";

export default async function MyWorkoutsPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  const [docs, trainers] = await Promise.all([
    prisma.clientDocument.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.membership.findMany({
      where: { gymId: client.gymId, role: { in: ["trainer", "gym_admin"] }, active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <main>
      <div className="row spread">
        <h1>My workouts</h1>
        <a href="/dashboard">← dashboard</a>
      </div>

      <h2>Trainer</h2>
      <MyTrainerSelect trainers={trainers} current={client.assignedTrainerId} />

      <h2>Workout cards</h2>
      {docs.length === 0 ? (
        <p className="muted">No workout card yet. Your trainer will upload one.</p>
      ) : (
        <div className="list">
          {docs.map((d) => (
            <a className="list-row" key={d.id} href={`/api/client-docs/${d.id}`} target="_blank" rel="noreferrer">
              <span className="lr-icon">📄</span>
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
