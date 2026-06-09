"use client";

import { useState } from "react";

interface Trainer { id: string; fullName: string }

export default function MyTrainerSelect({
  trainers,
  current,
}: {
  trainers: Trainer[];
  current: string | null;
}) {
  const [val, setVal] = useState(current ?? "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(v: string) {
    setVal(v);
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/my/trainer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId: v || null }),
    });
    setMsg(res.ok ? "saved" : "failed");
    setBusy(false);
  }

  return (
    <div className="card">
      <label>My trainer</label>
      <div className="row" style={{ marginTop: "0.4rem" }}>
        <select value={val} disabled={busy} onChange={(e) => save(e.target.value)}>
          <option value="">— none —</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>{t.fullName}</option>
          ))}
        </select>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </div>
  );
}
