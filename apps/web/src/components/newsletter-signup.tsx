"use client";

import { FormEvent, useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email,
          source: "footer"
        })
      });

      if (!response.ok) throw new Error(`subscribe failed: ${response.status}`);
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Email updates</p>
      <p className="text-sm text-muted-foreground">
        Occasional updates for major directory additions and launch notes.
      </p>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-10 rounded-xl border border-border bg-card px-4 text-sm text-foreground transition hover:border-primary/45 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {status === "loading" ? "Joining..." : "Join list"}
        </button>
      </form>
      {status === "success" ? (
        <p className="text-xs text-primary">You are on the list.</p>
      ) : null}
      {status === "error" ? (
        <p className="text-xs text-destructive">Could not subscribe right now. Try again in a bit.</p>
      ) : null}
    </div>
  );
}
