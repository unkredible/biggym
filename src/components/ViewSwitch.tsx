"use client";

import { useState } from "react";

/** Segmented switch in the menu: flip a staff user between managing the gym
 *  ("Gestione") and using it as a client ("Cliente"). */
export default function ViewSwitch({ current }: { current: "staff" | "client" }) {
  const [busy, setBusy] = useState(false);

  async function go(mode: "staff" | "client") {
    if (mode === current || busy) return;
    setBusy(true);
    await fetch("/api/me/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    window.location.assign("/dashboard"); // re-resolve the effective role
  }

  return (
    <div className="seg view-switch">
      <button type="button" className={current === "staff" ? "on" : ""} disabled={busy} onClick={() => go("staff")}>
        Gestione
      </button>
      <button type="button" className={current === "client" ? "on" : ""} disabled={busy} onClick={() => go("client")}>
        Cliente
      </button>
    </div>
  );
}
