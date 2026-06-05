"use client";

import { useState } from "react";

export default function AcceptButton({
  token,
  gymName,
}: {
  token: string;
  gymName: string;
}) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/staff/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      setMsg((await res.json()).error ?? "Failed.");
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <p>Join {gymName} now?</p>
      <button className="primary" disabled={busy} onClick={accept}>
        {busy ? "…" : "Accept & join"}
      </button>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
    </div>
  );
}
