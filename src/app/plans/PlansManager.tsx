"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Plan { id: string; name: string; priceCents: number | null; active: boolean }

function euros(c: number | null) {
  return c == null ? "" : (c / 100).toFixed(2);
}

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/plans");
    if (res.ok) setPlans((await res.json()).plans ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Name required.");
    setBusy(true);
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), price: price || null }),
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json().catch(() => ({}))).error ?? "Failed.");
    setName("");
    setPrice("");
    load();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this plan? Clients on it will be unassigned.")) return;
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="grid-2">
      <section>
        <h2>New plan</h2>
        <form className="card stack" onSubmit={add}>
          <label>Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Premium" />
          </label>
          <label>Price € / month <span className="muted">(optional)</span>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49.00" />
          </label>
          {err && <p className="error">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Add plan"}</button>
        </form>
      </section>

      <section>
        <h2>Plans</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="muted">No plans yet.</p>
        ) : (
          <div className="list">
            {plans.map((p) => (
              <div className="list-row" key={p.id}>
                <span className="lr-icon">🏷️</span>
                <span>
                  <strong>{p.name}</strong>
                  {!p.active && <span className="muted"> · inactive</span>}
                  <br />
                  <span className="muted">{p.priceCents == null ? "—" : `€${euros(p.priceCents)}/mo`}</span>
                </span>
                <span className="lr-value">
                  <button className="ghost" onClick={() => {
                    const n = prompt("Plan name", p.name);
                    if (n && n.trim()) patch(p.id, { name: n.trim() });
                  }}>rename</button>
                  <button className="ghost" onClick={() => {
                    const v = prompt("Price € / month (blank = none)", euros(p.priceCents));
                    if (v !== null) patch(p.id, { price: v.trim() });
                  }}>price</button>
                  <button className="ghost" onClick={() => patch(p.id, { active: !p.active })}>
                    {p.active ? "disable" : "enable"}
                  </button>
                  <button className="danger" style={{ padding: "0.2rem 0.6rem" }} onClick={() => remove(p.id)}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
