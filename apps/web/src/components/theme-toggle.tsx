"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

function setTheme(nextTheme: ThemeMode) {
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  localStorage.setItem("heyclaude-theme", nextTheme);
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setThemeState(current);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    const transition = document.startViewTransition?.bind(document);

    if (transition) {
      transition(() => {
        setTheme(nextTheme);
        setThemeState(nextTheme);
      });
      return;
    }

    setTheme(nextTheme);
    setThemeState(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel-strong)] text-[var(--ink)] shadow-[var(--shadow)] transition hover:scale-[1.02]"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <SunMedium className="h-4.5 w-4.5" />
      ) : (
        <MoonStar className="h-4.5 w-4.5" />
      )}
    </button>
  );
}
