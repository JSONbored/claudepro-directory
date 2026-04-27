"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleCheckBig } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useClientId } from "@/hooks/use-client-id";
import { cn } from "@/lib";

type SignalType = "used" | "works" | "broken";
type SignalCounts = Record<SignalType, number>;

type CommunitySignalPanelProps = {
  targetKind: "entry" | "tool";
  targetKey: string;
  className?: string;
};

const SIGNALS: Array<{
  type: SignalType;
  label: string;
  icon: typeof CircleCheckBig;
}> = [
  { type: "used", label: "Used this", icon: CircleCheckBig },
  { type: "works", label: "Works for me", icon: CheckCircle2 },
  { type: "broken", label: "Report broken", icon: AlertTriangle },
];

const ZERO_COUNTS: SignalCounts = { used: 0, works: 0, broken: 0 };

export function CommunitySignalPanel({
  targetKind,
  targetKey,
  className,
}: CommunitySignalPanelProps) {
  const [clientId] = useClientId("heyclaude-community-signal-client-id");
  const [counts, setCounts] = useState<SignalCounts>(ZERO_COUNTS);
  const [active, setActive] = useState<Partial<Record<SignalType, boolean>>>(
    {},
  );
  const [pending, setPending] = useState<SignalType | null>(null);

  const query = useMemo(
    () =>
      new URLSearchParams({
        targetKind,
        targetKey,
      }).toString(),
    [targetKind, targetKey],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      try {
        const response = await fetch(`/api/community-signals?${query}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as { counts?: SignalCounts };
        if (!cancelled && payload.counts) {
          setCounts({ ...ZERO_COUNTS, ...payload.counts });
        }
      } catch {
        if (!cancelled) {
          setCounts(ZERO_COUNTS);
        }
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [query]);

  async function toggleSignal(signalType: SignalType) {
    const nextActive = !active[signalType];
    setPending(signalType);
    setActive((current) => ({ ...current, [signalType]: nextActive }));
    setCounts((current) => ({
      ...current,
      [signalType]: Math.max(0, current[signalType] + (nextActive ? 1 : -1)),
    }));

    try {
      const response = await fetch("/api/community-signals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetKind,
          targetKey,
          signalType,
          clientId,
          active: nextActive,
        }),
      });
      const payload = (await response.json()) as { counts?: SignalCounts };
      if (payload.counts) {
        setCounts({ ...ZERO_COUNTS, ...payload.counts });
      }
    } catch {
      setActive((current) => ({ ...current, [signalType]: !nextActive }));
      setCounts((current) => ({
        ...current,
        [signalType]: Math.max(0, current[signalType] + (nextActive ? -1 : 1)),
      }));
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      aria-label="Community signals"
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          Community signals
        </h2>
        <p className="text-sm text-muted-foreground">
          Lightweight feedback helps surface useful listings without public star
          ratings.
        </p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {SIGNALS.map(({ type, label, icon: Icon }) => {
          const selected = Boolean(active[type]);
          return (
            <Button
              key={type}
              type="button"
              variant={selected ? "default" : "outline"}
              className="h-auto justify-start gap-2 px-3 py-3"
              aria-pressed={selected}
              disabled={pending !== null || !clientId}
              onClick={() => toggleSignal(type)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate">{label}</span>
                <span className="block text-xs opacity-80">{counts[type]}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
