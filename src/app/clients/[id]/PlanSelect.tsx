"use client";

import { useState } from "react";

interface Plan { id: string; name: string }

export default function PlanSelect({
  clientId,
  plans,
  current,
}: {
  clientId: string;
  plans: Plan[];
  current: string | null;
}) {
  const [val, setVal] = useState(current ?? "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(v: string) {
    setVal(v);
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: v || null }),
    });
    setMsg(res.ok ? "saved" : "failed");
    setBusy(false);
  }

  return (
    <div className="card">
      <label>Subscription plan</label>
      <div className="row" style={{ marginTop: "0.4rem" }}>
        <select value={val} disabled={busy} onChange={(e) => save(e.target.value)}>
          <option value="">— none —</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </div>
  );
}
