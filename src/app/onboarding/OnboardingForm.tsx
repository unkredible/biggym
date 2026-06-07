"use client";

import { useState } from "react";

export default function OnboardingForm() {
  const [gymName, setGymName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw !== pw2) {
      setError("Passwords don't match.");
      return;
    }
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gymName, password: pw }),
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url; // → Stripe Checkout
    } else if (res.ok) {
      window.location.href = "/dashboard"; // checkout unavailable, gym is trial
    } else {
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 420 }}>
      <div className="field">
        <label>Gym name</label>
        <input value={gymName} onChange={(e) => setGymName(e.target.value)} placeholder="Big Gym Milano" required />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="min 8 chars" required />
      </div>
      <div className="field">
        <label>Repeat password</label>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
      </div>
      {error && <p style={{ color: "var(--err)", margin: "0.6rem 0 0" }}>{error}</p>}
      <div className="row" style={{ marginTop: "1rem" }}>
        <button className="primary" disabled={busy} type="submit">
          {busy ? "…" : "Continue to payment"}
        </button>
      </div>
    </form>
  );
}
