"use client";

import { useState } from "react";

export default function AdminControls({
  rateCents,
  period,
}: {
  rateCents: number;
  period: string;
}) {
  const [euros, setEuros] = useState((rateCents / 100).toFixed(2));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const cents = Math.round(parseFloat(euros.replace(",", ".")) * 100);
    const res = await fetch("/api/admin/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cents }),
    });
    setMsg(res.ok ? "Rate saved." : "Failed to save rate.");
    setBusy(false);
  }

  async function runBilling() {
    if (!confirm(`Create Stripe invoice items for all unbilled activations?`))
      return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/bill", { method: "POST" });
    const data = await res.json();
    setMsg(
      res.ok
        ? `Billed ${data.results?.length ?? 0} gym(s).`
        : data.error ?? "Billing failed.",
    );
    setBusy(false);
  }

  return (
    <div className="card">
      <div className="row spread">
        <form onSubmit={saveRate} className="row">
          <label>€ per activated client</label>
          <input
            value={euros}
            onChange={(e) => setEuros(e.target.value)}
            inputMode="decimal"
            style={{ width: 90 }}
          />
          <button className="primary" disabled={busy} type="submit">
            Save rate
          </button>
        </form>
        <button disabled={busy} onClick={runBilling}>
          Run billing now ({period})
        </button>
      </div>
      {msg && <p className="muted" style={{ margin: "0.5rem 0 0" }}>{msg}</p>}
    </div>
  );
}
