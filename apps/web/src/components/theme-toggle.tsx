"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("heyclaude-theme", next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/90 bg-card px-3.5 text-foreground shadow-sm transition hover:bg-accent"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
      <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] lg:inline">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
