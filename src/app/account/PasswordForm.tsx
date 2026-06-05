"use client";

import { useState } from "react";

export default function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    if (res.ok) {
      setMsg("Password updated.");
      setCurrent("");
      setNext("");
    } else {
      setMsg((await res.json()).error ?? "Failed.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 380 }}>
      <strong>{hasPassword ? "Change password" : "Set a password"}</strong>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.6rem" }}>
        {hasPassword && (
          <input
            type="password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        )}
        <input
          type="password"
          placeholder="New password (min 8)"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <button className="primary" disabled={busy} type="submit">
          Save
        </button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}
