/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = document.cookie.match(/theme=([^;]+)/);
    if (stored) {
      const isDark = stored[1] !== "light";
      setDark(isDark);
      document.documentElement.classList.toggle("light", !isDark);
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    document.documentElement.classList.toggle("light", !next);
  }

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm transition-colors"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
