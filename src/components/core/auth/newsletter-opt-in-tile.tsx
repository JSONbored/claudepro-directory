'use client';

import type { CheckedState } from '@radix-ui/react-checkbox';
import { motion } from 'motion/react';
import { Checkbox } from '@/src/components/primitives/ui/checkbox';
import { cn } from '@/src/lib/utils';

interface NewsletterOptInTileProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  subscriberCountLabel: string;
  isLoadingCount?: boolean;
  headline?: string;
  description?: string;
  benefits?: string[];
  safetyCopy?: string;
  badgePrefix?: string;
}

export function NewsletterOptInTile({
  checked,
  onChange,
  subscriberCountLabel,
  isLoadingCount = false,
  headline,
  description,
  benefits,
  safetyCopy,
  badgePrefix,
}: NewsletterOptInTileProps) {
  const resolvedHeadline = headline ?? 'Your weekly Claude upgrade drop';
  const resolvedDescription =
    description ?? 'New MCP servers, pro prompts, and community playbooks — no fluff, just signal.';
  const resolvedBenefits =
    benefits && benefits.length > 0
      ? benefits
      : ['Curated Claude workflows & MCP servers', 'Power tips from top Claude builders'];
  const resolvedSafetyCopy = safetyCopy ?? 'No spam. Unsubscribe anytime.';
  const resolvedBadgePrefix = badgePrefix ?? '✨ Trusted by';

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
        'bg-gradient-to-br from-card/80 via-card/60 to-card/30 backdrop-blur-xl',
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
            <span className="text-muted-foreground text-xs">Weekly drop of Claude upgrades</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-xl">{resolvedHeadline}</p>
            <p className="text-muted-foreground text-sm">{resolvedDescription}</p>
          </div>
        </div>

        {!!resolvedBenefits.length && (
          <ul className="space-y-2 text-foreground/90 text-sm">
            {resolvedBenefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <span className="text-accent">•</span>
                {benefit}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label
            className="flex cursor-pointer items-center gap-3 font-medium text-foreground text-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
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
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
      </div>
    </motion.button>
  );
}
