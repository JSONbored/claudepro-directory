"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, CircleAlert } from "lucide-react";

type EntryChecklistCardProps = {
  entryKey: string;
  title: string;
  eyebrow?: string;
  description?: string;
  items: string[];
  variant?: "prerequisites" | "warning";
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function EntryChecklistCard({
  entryKey,
  title,
  eyebrow = "Checklist",
  description,
  items,
  variant = "prerequisites"
}: EntryChecklistCardProps) {
  const storageKey = useMemo(
    () => `heyclaude-checklist:${entryKey}:${slugify(title)}`,
    [entryKey, title]
  );
  const [open, setOpen] = useState(true);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      setCompleted(parsed);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(completed));
    } catch {}
  }, [completed, storageKey]);

  const completeCount = items.filter((item) => completed[item]).length;
  const progress = items.length ? Math.round((completeCount / items.length) * 100) : 0;

  return (
    <section
      className={`checklist-card ${variant === "warning" ? "checklist-card-warning" : "checklist-card-prerequisites"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="checklist-card-summary"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="checklist-card-icon">
            {variant === "warning" ? (
              <CircleAlert className="size-4" />
            ) : (
              <Check className="size-4" />
            )}
          </span>
          <div className="min-w-0 text-left">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground">
              {completeCount}/{items.length}
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Complete
            </p>
          </div>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border/70 px-5 py-5">
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div className="checklist-card-progress" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {progress}% complete
            </p>
          </div>

          <ul className="space-y-3">
            {items.map((item) => {
              const isDone = Boolean(completed[item]);
              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() =>
                      setCompleted((current) => ({
                        ...current,
                        [item]: !current[item]
                      }))
                    }
                    className={`checklist-item ${isDone ? "checklist-item-complete" : ""}`}
                  >
                    <span className={`checklist-item-box ${isDone ? "checklist-item-box-complete" : ""}`}>
                      {isDone ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className="min-w-0 text-left text-sm leading-7">{item}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
