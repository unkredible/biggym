"use client";

import { useState } from "react";

const STATUSES = ["lead", "consents", "anamnesis", "assigned", "active"];

interface Props {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  fiscalCode: string;
  birthDate: string; // yyyy-mm-dd or ""
  onboardingStatus: string;
}

export default function ClientEditForm(p: Props) {
  const [f, setF] = useState(p);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Props, v: string) => setF({ ...f, [k]: v });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/clients/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: f.fullName,
        email: f.email,
        phone: f.phone,
        city: f.city,
        fiscalCode: f.fiscalCode,
        birthDate: f.birthDate || null,
        onboardingStatus: f.onboardingStatus,
      }),
    });
    setMsg(res.ok ? "Saved." : (await res.json()).error ?? "Failed.");
    setBusy(false);
  }

  async function remove() {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    const res = await fetch(`/api/clients/${p.id}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/people";
  }

  return (
    <form onSubmit={save} className="card">
      <div className="field">
        <label>Full name</label>
        <input value={f.fullName} onChange={(e) => set("fullName", e.target.value)} required />
      </div>
      <div className="row" style={{ gap: "0.5rem", marginTop: "0.6rem" }}>
        <input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" style={{ flex: 1 }} />
        <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" style={{ flex: 1 }} />
      </div>
      <div className="row" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
        <input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="City" style={{ flex: 1 }} />
        <input value={f.fiscalCode} onChange={(e) => set("fiscalCode", e.target.value)} placeholder="Fiscal code" style={{ flex: 1 }} />
      </div>
      <div className="row" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Birth date</label>
          <input type="date" value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Status</label>
          <select value={f.onboardingStatus} onChange={(e) => set("onboardingStatus", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="row" style={{ marginTop: "0.9rem", gap: "0.5rem" }}>
        <button className="primary" disabled={busy} type="submit">Save</button>
        <button className="danger" type="button" onClick={remove}>Delete</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}
