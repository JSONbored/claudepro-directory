"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Mail, X } from "lucide-react";

import { cn } from "@/lib";

const DISMISS_KEY = "heyclaude-newsletter-dismissed-until";
const SUBSCRIBED_KEY = "heyclaude-newsletter-subscribed";
const SHOWN_SESSION_KEY = "heyclaude-newsletter-shown-session";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 14;

type PromptStatus = "idle" | "loading" | "success" | "error";

export function NewsletterPrompt() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<PromptStatus>("idle");
  const [open, setOpen] = useState(false);
  const [hasIntent, setHasIntent] = useState(false);
  const [dwellReady, setDwellReady] = useState(false);
  const [scrollReady, setScrollReady] = useState(false);
  const [suppressed, setSuppressed] = useState(false);

  const canDisplay = useMemo(() => {
    if (status === "success") return true;
    return hasIntent ? dwellReady || scrollReady : dwellReady && scrollReady;
  }, [dwellReady, hasIntent, scrollReady, status]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SUBSCRIBED_KEY) === "1") return;
      if (window.sessionStorage.getItem(SHOWN_SESSION_KEY) === "1") return;
      const dismissedUntil = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
      if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) return;
    } catch {
      return;
    }

    const dwellTimer = window.setTimeout(() => setDwellReady(true), 55000);

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = window.scrollY / scrollable;
      if (progress >= 0.4) setScrollReady(true);
    };

    const onIntent = () => setHasIntent(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("heyclaude:intent", onIntent as EventListener);
    onScroll();

    return () => {
      window.clearTimeout(dwellTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("heyclaude:intent", onIntent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (suppressed || !canDisplay || open) return;
    setOpen(true);
    try {
      window.sessionStorage.setItem(SHOWN_SESSION_KEY, "1");
    } catch {}
  }, [canDisplay, open, suppressed]);

  const dismiss = (persist: boolean) => {
    if (persist) {
      try {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
      } catch {}
    }
    setSuppressed(true);
    setOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email,
          source: "floating_prompt"
        })
      });

      if (!response.ok) throw new Error(`subscribe failed: ${response.status}`);

      setStatus("success");
      setEmail("");
      try {
        window.localStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {}
      setSuppressed(true);

      window.setTimeout(() => {
        setOpen(false);
      }, 1800);
    } catch {
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <aside
      className={cn(
        "fixed bottom-4 left-4 z-[75] w-[min(26rem,calc(100vw-1.5rem))] rounded-2xl border border-border/85 bg-card/95 p-4 shadow-2xl backdrop-blur toast-enter"
      )}
      role="dialog"
      aria-label="Newsletter signup"
    >
      <button
        type="button"
        onClick={() => dismiss(true)}
        className="absolute top-2.5 right-2.5 inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        aria-label="Dismiss newsletter prompt"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-7">
        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Mail className="size-4" />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-foreground">Get high-signal Claude updates</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Occasional launch notes, best new configs, and practical workflow drops. No spam.
          </p>
        </div>
      </div>

      <form className="mt-3 flex items-center gap-2" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-10 shrink-0 rounded-xl border border-primary/35 bg-primary px-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {status === "loading" ? "Joining..." : "Join"}
        </button>
      </form>

      {status === "success" ? (
        <p className="mt-2 text-xs text-emerald-500">You are on the list.</p>
      ) : null}
      {status === "error" ? (
        <p className="mt-2 text-xs text-destructive">Could not subscribe right now. Try again later.</p>
      ) : null}
    </aside>
  );
}
