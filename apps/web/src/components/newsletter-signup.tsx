"use client";

import { Check } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { useToast } from "@/components/ui/toast-provider";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const { pushToast } = useToast();

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "footer",
        }),
      });

      if (!response.ok) throw new Error(`subscribe failed: ${response.status}`);
      setStatus("success");
      setEmail("");
      pushToast({
        variant: "success",
        title: "Subscribed",
        description: "You are on the list for launch and major updates.",
      });
    } catch {
      setStatus("error");
      pushToast({
        variant: "error",
        title: "Subscription failed",
        description: "Could not subscribe right now. Try again in a bit.",
      });
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
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary sm:min-w-[17rem]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm text-foreground transition hover:border-primary/45 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {status === "loading" ? (
            "Joining..."
          ) : status === "success" ? (
            <>
              <Check className="size-4 text-emerald-500" />
              Joined
            </>
          ) : (
            "Join"
          )}
        </button>
      </form>
    </div>
  );
}
