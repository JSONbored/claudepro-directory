"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib";

type ThemeMode = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.add("theme-switching");
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("heyclaude-theme", next);
    setTheme(next);
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-switching");
    }, 220);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle-utility"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className={cn(
          "theme-toggle-icon-wrap",
          theme === "dark"
            ? "theme-toggle-icon-wrap-dark"
            : "theme-toggle-icon-wrap-light",
        )}
        aria-hidden
      >
        <SunMedium
          className={cn(
            "theme-toggle-icon theme-toggle-icon-sun",
            theme === "dark"
              ? "theme-toggle-icon-hidden"
              : "theme-toggle-icon-visible",
          )}
        />
        <MoonStar
          className={cn(
            "theme-toggle-icon theme-toggle-icon-moon",
            theme === "dark"
              ? "theme-toggle-icon-visible"
              : "theme-toggle-icon-hidden",
          )}
        />
      </span>
    </button>
  );
}
