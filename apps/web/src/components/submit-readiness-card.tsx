export type SubmitReadinessItem = {
  label: string;
  ready: boolean;
};

type SubmitReadinessCardProps = {
  category: string;
  items: SubmitReadinessItem[];
  sourceWarning: boolean;
};

export function SubmitReadinessCard({
  category,
  items,
  sourceWarning,
}: SubmitReadinessCardProps) {
  const missingItems = items.filter((item) => !item.ready);

  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3 text-xs leading-6 text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground">
          Submission readiness
        </span>
        <span>
          {category
            ? missingItems.length === 0
              ? "Likely to pass required field checks"
              : `${missingItems.length} required field${
                  missingItems.length === 1 ? "" : "s"
                } missing`
            : "Select a category to preview required fields"}
        </span>
      </div>
      {items.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/70 px-3 py-2"
            >
              <span>{item.label}</span>
              <span
                className={item.ready ? "text-primary" : "text-destructive"}
              >
                {item.ready ? "ready" : "missing"}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {sourceWarning ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Source URL is not currently required by the validator, but submissions
          without GitHub or docs links are harder to review and may need
          follow-up before maintainer review.
        </p>
      ) : null}
    </div>
  );
}
