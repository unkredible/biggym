"use client";

import { useState } from "react";

/** Switch a staff user between managing their gym and using it as a client. */
export default function ViewToggle({
  mode,
  className,
  children,
}: {
  mode: "client" | "staff";
  className?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    await fetch("/api/me/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    // full reload so the server shell re-resolves the effective role.
    window.location.assign("/dashboard");
  }

  return (
    <button className={className} disabled={busy} onClick={go}>
      {busy ? "…" : children}
    </button>
  );
}
