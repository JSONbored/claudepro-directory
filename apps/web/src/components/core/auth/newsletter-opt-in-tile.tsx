'use client';

import { cn } from '@heyclaude/web-runtime/ui';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { motion } from 'motion/react';
import { useId } from 'react';
import { Checkbox } from '@heyclaude/web-runtime/ui';

interface NewsletterOptInTileProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  subscriberCountLabel: string;
  isLoadingCount?: boolean;
  headline?: string;
  safetyCopy?: string;
  badgePrefix?: string;
}

export function NewsletterOptInTile({
  checked,
  onChange,
  subscriberCountLabel,
  isLoadingCount = false,
  headline,
  safetyCopy,
  badgePrefix,
}: NewsletterOptInTileProps) {
  const resolvedHeadline = headline ?? 'Your weekly Claude upgrade drop';
  const resolvedSafetyCopy = safetyCopy ?? 'No spam. Unsubscribe anytime.';
  const resolvedBadgePrefix = badgePrefix ?? '✨ Trusted by';

  const checkboxId = useId();

  const badgeLabel = isLoadingCount
    ? '✨ Loading Claude builders…'
    : `${resolvedBadgePrefix} ${subscriberCountLabel} Claude builders`;

  const handleCheckboxChange = (value: CheckedState) => {
    if (value === 'indeterminate') return;
    onChange(Boolean(value));
  };

  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300',
        'bg-linear-to-br from-card/80 via-card/60 to-card/30 backdrop-blur-xl',
        checked
          ? 'border-accent/70 shadow-[0_10px_40px_-20px_rgba(255,138,76,0.8)]'
          : 'border-white/10 hover:border-accent/40 hover:shadow-[0_10px_40px_-20px_rgba(255,138,76,0.6)]'
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 font-semibold text-white/90 text-xs">
              {badgeLabel}
            </span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-xl">{resolvedHeadline}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor={checkboxId}
            className="flex cursor-pointer items-center gap-3 font-medium text-foreground text-sm"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onKeyUp={(event) => event.stopPropagation()}
          >
            <Checkbox
              id={checkboxId}
              checked={checked}
              onCheckedChange={handleCheckboxChange}
              aria-label="Opt into weekly Claude newsletter"
            />
            Send me the weekly Claude upgrade drop
          </label>
          <span className="text-muted-foreground text-xs">{resolvedSafetyCopy}</span>
        </div>
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          checked ? 'opacity-80' : 'opacity-0'
        )}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-transparent" />
      </div>
    </motion.button>
  );
}
