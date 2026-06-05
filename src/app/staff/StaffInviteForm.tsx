"use client";

import { useState } from "react";

export default function StaffInviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("trainer");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setMsg(res.ok ? `Invite sent to ${email}.` : (await res.json()).error ?? "Failed.");
    if (res.ok) setEmail("");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card">
      <strong>Invite staff</strong>
      <div className="row" style={{ marginTop: "0.6rem", gap: "0.5rem" }}>
        <input
          type="email"
          placeholder="staff@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ flex: 2 }}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="trainer">Trainer</option>
          <option value="reception">Reception</option>
          <option value="gym_admin">Gym admin</option>
        </select>
        <button className="primary" disabled={busy} type="submit">
          Send
        </button>
      </div>
      {msg && <p className="muted" style={{ margin: "0.5rem 0 0" }}>{msg}</p>}
    </form>
  );
}
