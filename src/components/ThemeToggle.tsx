"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@/components/icons";

/** Light/dark toggle. Persists to the biggym_mode cookie and flips
 *  data-mode on <html> instantly (no reload). */
export default function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const m = document.documentElement.getAttribute("data-mode");
    setMode(m === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
    document.cookie = `biggym_mode=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === "dark" ? "Tema chiaro" : "Tema scuro"}
      className={className ?? "iconbtn"}
    >
      {mode === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
