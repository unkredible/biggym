"use client";

import { useState } from "react";

export default function LogForm() {
  const [note, setNote] = useState("");
  const [loadKg, setLoadKg] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/my/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note,
        loadKg: loadKg ? Number(loadKg) : undefined,
        reps: reps ? Number(reps) : undefined,
        rpe: rpe ? Number(rpe) : undefined,
      }),
    });
    if (res.ok) {
      setMsg("Logged.");
      setLoadKg("");
      setReps("");
      setRpe("");
      setNote("");
      setTimeout(() => window.location.reload(), 600);
    } else {
      setMsg("Failed.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="row" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
        <input placeholder="exercise / note" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 2, minWidth: 140 }} />
        <input placeholder="kg" type="number" value={loadKg} onChange={(e) => setLoadKg(e.target.value)} style={{ width: 80 }} />
        <input placeholder="reps" type="number" value={reps} onChange={(e) => setReps(e.target.value)} style={{ width: 70 }} />
        <input placeholder="rpe" type="number" value={rpe} onChange={(e) => setRpe(e.target.value)} style={{ width: 64 }} />
        <button className="primary" disabled={busy} type="submit">Log</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}
