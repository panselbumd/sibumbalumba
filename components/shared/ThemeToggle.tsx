"use client";

import { useEffect, useState } from "react";

/**
 * Toggle dark/light mode. Preferensi disimpan di localStorage —
 * ini file Next.js biasa (bukan artifact claude.ai), jadi localStorage
 * aman dipakai di sini.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sibumbalumba-theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sibumbalumba-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Ganti mode terang/gelap"
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm border transition-colors"
      style={{ borderColor: "var(--color-border)" }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
