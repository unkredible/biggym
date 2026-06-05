"use client";

import { useState } from "react";

export default function GymRateForm({
  gymId,
  overrideCents,
  defaultCents,
}: {
  gymId: string;
  overrideCents: number | null;
  defaultCents: number;
}) {
  const [euros, setEuros] = useState(
    overrideCents != null ? (overrideCents / 100).toFixed(2) : "",
  );
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(cents: number | null) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/gym-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gymId, cents }),
    });
    setMsg(res.ok ? "saved" : "failed");
    setBusy(false);
  }

  return (
    <div className="row" style={{ gap: "0.4rem", marginTop: "0.4rem" }}>
      <label>rate €</label>
      <input
        value={euros}
        onChange={(e) => setEuros(e.target.value)}
        placeholder={(defaultCents / 100).toFixed(2)}
        inputMode="decimal"
        style={{ width: 80 }}
      />
      <button
        disabled={busy}
        onClick={() =>
          save(Math.round(parseFloat(euros.replace(",", ".")) * 100))
        }
      >
        Set
      </button>
      <button
        disabled={busy}
        onClick={() => {
          setEuros("");
          save(null);
        }}
        title="Use platform default"
      >
        Use default
      </button>
      {msg && <span className="muted">{msg}</span>}
    </div>
  );
}
