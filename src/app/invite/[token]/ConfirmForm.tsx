"use client";

import { useState } from "react";

export default function ConfirmForm({
  token,
  defaultName,
  gymName,
}: {
  token: string;
  defaultName: string;
  gymName: string;
}) {
  const [fullName, setFullName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/invite/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, fullName, phone }),
    });
    if (res.ok) setDone(true);
    else setError((await res.json()).error ?? "Failed.");
    setBusy(false);
  }

  if (done) {
    return (
      <div className="card">
        <h2>You&apos;re in 🎉</h2>
        <p>Your membership at {gymName} is confirmed.</p>
      </div>
    );
  }

  return (
    <form onSubmit={confirm} className="card" style={{ maxWidth: 380 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <label>Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <label>Phone (optional)</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        {error && <span style={{ color: "crimson" }}>{error}</span>}
        <button className="primary" disabled={busy} type="submit">
          {busy ? "…" : "Confirm membership"}
        </button>
      </div>
    </form>
  );
}
