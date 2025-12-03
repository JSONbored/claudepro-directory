'use client';

import { cn } from '@heyclaude/web-runtime/ui';
import {
  absolute,
  alignItems,
  animateDuration,
  backdrop,
  bgGradient,
  border,
  cluster,
  cursor,
  display,
  flexWrap,
  gap,
  gradientFrom,
  gradientTo,
  gradientVia,
  muted,
  opacityLevel,
  overflow,
  padding,
  position,
  radius,
  responsive,
  size,
  stack,
  textAlign,
  textColor,
  transition,
  weight,
  width,
  pointerEvents,
  borderColor,
  shadow,
  hoverShadow,
  hoverBorder,
} from '@heyclaude/web-runtime/design-system';
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

/**
 * Renders an interactive newsletter opt-in tile with a checkbox, headline, badge, and safety copy.
 *
 * The tile is clickable to toggle the checked state, shows a subscriber-count badge (or a loading label),
 * and exposes an accessible checkbox for keyboard and screen-reader users.
 *
 * @param checked - Whether the tile is currently selected.
 * @param onChange - Callback invoked with the next boolean checked state when the tile or checkbox changes.
 * @param subscriberCountLabel - Text shown after the badge prefix to indicate subscriber count.
 * @param isLoadingCount - When true, replaces the badge with a loading label.
 * @param headline - Optional headline text; defaults to "Your weekly Claude upgrade drop".
 * @param safetyCopy - Optional secondary copy; defaults to "No spam. Unsubscribe anytime.".
 * @param badgePrefix - Optional prefix for the badge; defaults to "✨ Trusted by".
 *
 * @returns The newsletter opt-in tile React element.
 *
 * @see Checkbox
 * @see cn
 */
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
        `group ${position.relative} ${width.full} ${overflow.hidden} ${radius['2xl']} ${border.default} ${padding.comfortable} ${textAlign.left} ${transition.all} ${animateDuration.slow}`,
        `${bgGradient.toBR} ${gradientFrom.card80} ${gradientVia.card60} ${gradientTo.card30} ${backdrop.xl}`,
        checked
          ? `${borderColor['accent/70']} ${shadow.accentGlow}`
          : `${borderColor['white/10']} ${hoverBorder['accent/40']} ${hoverShadow.accentGlow}`
      )}
    >
      <div className={stack.relaxed}>
        <div className={stack.default}>
          <div className={`${cluster.default} ${flexWrap.wrap}`}>
            <span className={`${display.inlineFlex} ${alignItems.center} ${radius.full} bg-white/10 ${padding.xCompact} ${padding.yMicro} ${weight.semibold} ${textColor.white}/90 ${size.xs}`}>
              {badgeLabel}
            </span>
          </div>
          <div>
            <p className={`${weight.semibold} ${textColor.foreground} ${size.xl}`}>{resolvedHeadline}</p>
          </div>
        </div>

        <div className={responsive.smRowBetween}>
          <label
            htmlFor={checkboxId}
            className={`${display.flex} ${cursor.pointer} ${alignItems.center} ${gap.default} ${weight.medium} ${textColor.foreground} ${size.sm}`}
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
          <span className={`${muted.default} ${size.xs}`}>{resolvedSafetyCopy}</span>
        </div>
      </div>
      <div
        className={cn(
          `${pointerEvents.none} ${absolute.inset} ${opacityLevel[0]} ${transition.opacity} ${animateDuration.slow} group-hover:${opacityLevel[100]}`,
          checked ? opacityLevel[80] : opacityLevel[0]
        )}
        aria-hidden="true"
      >
        <div className={`${absolute.inset} ${bgGradient.toBR} ${gradientFrom.accent10} ${gradientVia.transparent} ${gradientTo.transparent}`} />
      </div>
    </motion.button>
  );
}