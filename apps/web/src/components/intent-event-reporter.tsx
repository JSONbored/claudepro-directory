"use client";

import { useEffect } from "react";

type IntentEventDetail = {
  type?: string;
  entryKey?: string;
};

export function IntentEventReporter() {
  useEffect(() => {
    const storageKey = "heyclaude-intent-session-id";
    const getSessionId = () => {
      const existing = window.localStorage.getItem(storageKey);
      if (existing) return existing;
      const generated = crypto.randomUUID();
      window.localStorage.setItem(storageKey, generated);
      return generated;
    };

    const listener = (event: Event) => {
      const detail = (event as CustomEvent<IntentEventDetail>).detail ?? {};
      if (!detail.type) return;
      void fetch("/api/intent-events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: detail.type,
          entryKey: detail.entryKey,
          sessionId: getSessionId(),
        }),
        keepalive: true,
      }).catch(() => undefined);
    };

    window.addEventListener("heyclaude:intent", listener);
    return () => window.removeEventListener("heyclaude:intent", listener);
  }, []);

  return null;
}
