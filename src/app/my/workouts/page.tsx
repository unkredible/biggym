import { redirect } from "next/navigation";
import { currentClient } from "@/lib/gym";
import { prisma } from "@/lib/db";
import LogForm from "./LogForm";

export const dynamic = "force-dynamic";

export default async function MyWorkoutsPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  const [programs, recentLogs] = await Promise.all([
    prisma.workoutProgram.findMany({
      where: { clientId: client.id, status: "active" },
      orderBy: { createdAt: "desc" },
      include: {
        days: {
          orderBy: { dayOrder: "asc" },
          include: { exercises: { orderBy: { exerciseOrder: "asc" } } },
        },
      },
    }),
    prisma.workoutLog.findMany({
      where: { clientId: client.id },
      orderBy: { performedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <main>
      <div className="row spread">
        <h1>My workouts</h1>
        <a href="/dashboard">← dashboard</a>
      </div>

      {programs.length === 0 && (
        <p className="muted">No program assigned yet. Your trainer will add one.</p>
      )}

      {programs.map((p) => (
        <div key={p.id}>
          <h2>{p.title}</h2>
          {p.goal && <p className="muted">{p.goal}</p>}
          {p.days.map((d) => (
            <div className="card" key={d.id}>
              <strong>{d.title}</strong>
              <table style={{ width: "100%", marginTop: "0.5rem", borderCollapse: "collapse" }}>
                <tbody>
                  {d.exercises.map((e) => (
                    <tr key={e.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.35rem 0" }}>{e.exerciseName}</td>
                      <td className="muted" style={{ textAlign: "right" }}>
                        {e.targetSets}×{e.targetReps}
                        {e.targetLoad ? ` @ ${e.targetLoad}` : ""}
                        {e.restSeconds ? ` · ${e.restSeconds}s` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}

      <h2>Log a set</h2>
      <LogForm />

      {recentLogs.length > 0 && (
        <>
          <h3>Recent</h3>
          {recentLogs.map((l) => (
            <div className="card" key={l.id}>
              <span className="muted">
                {new Date(l.performedAt).toLocaleString()} ·{" "}
              </span>
              {l.loadKg ?? "—"}kg × {l.reps ?? "—"}
              {l.rpe ? ` @RPE${l.rpe}` : ""} {l.note ? `· ${l.note}` : ""}
            </div>
          ))}
        </>
      )}
    </main>
  );
}
