"use client";

import { useState } from "react";

interface GymOpt {
  gymId: string;
  name: string;
  role: string;
}

export default function GymSwitcher({
  gyms,
  activeId,
}: {
  gyms: GymOpt[];
  activeId: string | null;
}) {
  const [busy, setBusy] = useState(false);

  async function switchTo(id: string) {
    if (id === activeId) return;
    setBusy(true);
    await fetch("/api/gym/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gymId: id }),
    });
    window.location.href = "/dashboard";
  }

  return (
    <select
      value={activeId ?? ""}
      disabled={busy}
      onChange={(e) => switchTo(e.target.value)}
      title="Switch gym"
    >
      {gyms.map((g) => (
        <option key={g.gymId} value={g.gymId}>
          {g.name} ({g.role})
        </option>
      ))}
    </select>
  );
}
