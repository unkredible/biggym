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
    <form onSubmit={submit} className="card">
      <strong>{hasPassword ? "Change password" : "Set a password"}</strong>
      {!hasPassword && (
        <p className="muted" style={{ margin: "0.3rem 0 0" }}>
          You currently sign in with a magic link or Google. Set a password to
          also log in with email + password.
        </p>
      )}
      {hasPassword && (
        <div className="field">
          <label>Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
      )}
      <div className="field">
        <label>New password (min 8)</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
      </div>
      <div className="row" style={{ marginTop: "0.9rem" }}>
        <button className="primary" disabled={busy} type="submit">Save password</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}
