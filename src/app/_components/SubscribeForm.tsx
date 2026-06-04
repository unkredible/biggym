"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [gymName, setGymName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/portal/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gymName, email }),
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url; // → Stripe Checkout
    } else {
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 420 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label>Gym name</label>
        <input
          value={gymName}
          onChange={(e) => setGymName(e.target.value)}
          placeholder="Big Gym Milano"
          required
        />
        <label>Your email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@biggym.it"
          required
        />
        {error && <span style={{ color: "var(--err, crimson)" }}>{error}</span>}
        <button className="primary" disabled={busy} type="submit">
          {busy ? "Redirecting…" : "Start subscription"}
        </button>
        <span className="muted">
          You&apos;ll be sent to Stripe to complete payment, then receive a
          sign-in link by email.
        </span>
      </div>
    </form>
  );
}
