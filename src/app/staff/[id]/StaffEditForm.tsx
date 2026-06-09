"use client";

import { useState } from "react";

export default function StaffEditForm({
  id,
  fullName,
  role,
  active,
  isSelf,
}: {
  id: string;
  fullName: string;
  role: string;
  active: boolean;
  isSelf: boolean;
}) {
  const [name, setName] = useState(fullName);
  const [r, setR] = useState(role);
  const [act, setAct] = useState(active);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: name, role: r, active: act }),
    });
    setMsg(res.ok ? "Saved." : (await res.json()).error ?? "Failed.");
    setBusy(false);
  }

  async function remove() {
    if (!confirm("Remove this staff member from the gym?")) return;
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/people";
    else setMsg((await res.json()).error ?? "Failed.");
  }

  return (
    <form onSubmit={save} className="card">
      <div className="field">
        <label>Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label>Permission level (role)</label>
        <select value={r} onChange={(e) => setR(e.target.value)}>
          <option value="trainer">Trainer</option>
          <option value="reception">Reception</option>
          <option value="gym_admin">Gym admin</option>
        </select>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.6rem" }}>
        <input type="checkbox" checked={act} onChange={(e) => setAct(e.target.checked)} style={{ width: "auto" }} />
        Active
      </label>
      <div className="row" style={{ marginTop: "0.9rem", gap: "0.5rem" }}>
        <button className="primary" disabled={busy} type="submit">Save</button>
        {!isSelf && (
          <button className="danger" type="button" onClick={remove}>Remove</button>
        )}
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}
