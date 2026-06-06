"use client";

import { useEffect, useState } from "react";

interface Exercise {
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  targetLoad: string;
  restSeconds: number | "";
  notes: string;
}
interface Day {
  title: string;
  exercises: Exercise[];
}

function emptyExercise(): Exercise {
  return { exerciseName: "", targetSets: 3, targetReps: "8-10", targetLoad: "", restSeconds: 90, notes: "" };
}

export default function ProgramEditor({ clientId }: { clientId: string }) {
  const [title, setTitle] = useState("Program");
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/clients/${clientId}/program`);
      if (res.ok) {
        const { program } = await res.json();
        if (program) {
          setTitle(program.title);
          setGoal(program.goal ?? "");
          setDays(
            (program.days ?? []).map((d: { title: string; exercises: unknown[] }) => ({
              title: d.title,
              exercises: ((d.exercises ?? []) as Record<string, unknown>[]).map((e) => ({
                exerciseName: (e.exerciseName as string) ?? "",
                targetSets: (e.targetSets as number) ?? 3,
                targetReps: (e.targetReps as string) ?? "8-10",
                targetLoad: (e.targetLoad as string) ?? "",
                restSeconds: (e.restSeconds as number) ?? 90,
                notes: (e.notes as string) ?? "",
              })),
            })),
          );
        }
      }
      setLoading(false);
    })();
  }, [clientId]);

  function addDay() {
    setDays([...days, { title: `Day ${days.length + 1}`, exercises: [emptyExercise()] }]);
  }
  function removeDay(i: number) {
    setDays(days.filter((_, idx) => idx !== i));
  }
  function setDay(i: number, patch: Partial<Day>) {
    setDays(days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function addExercise(di: number) {
    setDay(di, { exercises: [...days[di]!.exercises, emptyExercise()] });
  }
  function setExercise(di: number, ei: number, patch: Partial<Exercise>) {
    setDay(di, {
      exercises: days[di]!.exercises.map((e, idx) => (idx === ei ? { ...e, ...patch } : e)),
    });
  }
  function removeExercise(di: number, ei: number) {
    setDay(di, { exercises: days[di]!.exercises.filter((_, idx) => idx !== ei) });
  }

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/clients/${clientId}/program`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, goal, days }),
    });
    setMsg(res.ok ? "Saved." : (await res.json()).error ?? "Failed.");
    setBusy(false);
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label>Program title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <label>Goal (optional)</label>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Hypertrophy, strength…" />
        </div>
      </div>

      {days.map((d, di) => (
        <div className="card" key={di}>
          <div className="row spread">
            <input
              value={d.title}
              onChange={(e) => setDay(di, { title: e.target.value })}
              style={{ fontWeight: 600, flex: 1 }}
            />
            <button className="danger" onClick={() => removeDay(di)}>Remove day</button>
          </div>

          {d.exercises.map((ex, ei) => (
            <div className="row" key={ei} style={{ gap: "0.4rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              <input placeholder="Exercise" value={ex.exerciseName}
                onChange={(e) => setExercise(di, ei, { exerciseName: e.target.value })} style={{ flex: 2, minWidth: 140 }} />
              <input placeholder="sets" type="number" value={ex.targetSets}
                onChange={(e) => setExercise(di, ei, { targetSets: Number(e.target.value) })} style={{ width: 64 }} />
              <input placeholder="reps" value={ex.targetReps}
                onChange={(e) => setExercise(di, ei, { targetReps: e.target.value })} style={{ width: 72 }} />
              <input placeholder="load" value={ex.targetLoad}
                onChange={(e) => setExercise(di, ei, { targetLoad: e.target.value })} style={{ width: 80 }} />
              <input placeholder="rest s" type="number" value={ex.restSeconds}
                onChange={(e) => setExercise(di, ei, { restSeconds: e.target.value === "" ? "" : Number(e.target.value) })} style={{ width: 70 }} />
              <button onClick={() => removeExercise(di, ei)}>✕</button>
            </div>
          ))}
          <button onClick={() => addExercise(di)} style={{ marginTop: "0.5rem" }}>+ exercise</button>
        </div>
      ))}

      <div className="row" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
        <button onClick={addDay}>+ day</button>
        <button className="primary" disabled={busy} onClick={save}>Save program</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </div>
  );
}
