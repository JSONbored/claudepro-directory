'use client';

import type { Database } from '@heyclaude/database-types';
import {
  animateDuration,
  backdrop,
  bgColor,
  bgGradient,
  borderColor,
  cluster,
  flexGrow,
  gradientFrom,
  gradientVia,
  gradientTo,
  helper,
  iconSize,
  opacityLevel,
  padding,
  responsive,
  shadow,
  size,
  stack,
  textColor,
  transition,
  weight,
  position,
  absolute,
  width,
  cursor,
  height,
  whitespace,
  minWidth,
  buttonHeight,
  activeScale,
} from '@heyclaude/web-runtime/design-system';
// Confetti is enabled
const CONFETTI_ENABLED = true;
import { NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { Mail } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { useId, useState } from 'react';
import { InlineSpinner } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { useConfetti } from '@heyclaude/web-runtime/hooks';
import { useNewsletter } from '@heyclaude/web-runtime/hooks';

export interface NewsletterFormProps {
  source: Database['public']['Enums']['newsletter_source'];
  className?: string;
}

/**
 * Renders a newsletter subscription form with email input, submit button, inline validation, and optional confetti on successful subscription.
 *
 * The form manages email state, shows a loading spinner while submitting, displays an error message when subscription fails, and fires subtle confetti if enabled in configuration after a successful subscription.
 *
 * @param source - Source identifier to annotate where the newsletter signup originated (used by the subscription hook).
 * @param className - Optional additional CSS class names to apply to the form container.
 * @returns The newsletter form element ready to be embedded in a React tree.
 *
 * @see useNewsletter
 * @see useConfetti
 * @see NEWSLETTER_CTA_CONFIG
 */
export function NewsletterForm({ source, className }: NewsletterFormProps) {
  const { fireConfetti } = useConfetti();
  const { email, setEmail, isSubmitting, subscribe, error } = useNewsletter({
    source,
    onSuccess: async () => {
      // Check confetti enabled (static config)
      if (CONFETTI_ENABLED) {
        fireConfetti('subtle');
      }
    },
  });
  const errorId = useId();
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await subscribe();
  };

  return (
    <form onSubmit={handleSubmit} className={cn(width.full, className)}>
      <div className={stack.default}>
        <div className={responsive.smRowGap}>
          <div className={`${position.relative} ${flexGrow['1']}`}>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              required={true}
              disabled={isSubmitting}
              className={cn(
                `${buttonHeight.lg} ${minWidth[0]} ${padding.xMedium} ${size.base}`,
                `${borderColor['border/40']} ${bgColor['background/95']} ${backdrop.sm}`,
                `${transition.all} ${animateDuration.default}`,
                `focus:${borderColor['accent/50']} focus:ring-2 focus:ring-accent/20`,
                error && `${borderColor['destructive/50']} focus:${borderColor.destructive} focus:ring-destructive/20`,
                isSubmitting && `${cursor.notAllowed} ${opacityLevel[60]}`
              )}
              aria-label="Email address"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            <div
              className={cn(
                `${absolute.bottomLeft} ${height.hairline} ${bgGradient.toR} ${gradientFrom.accent} ${gradientTo.primary} ${transition.all} ${animateDuration.slow}`,
                isFocused && !error ? `${width.full} ${opacityLevel[100]}` : `${width[0]} ${opacityLevel[0]}`
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            size="lg"
            className={cn(
              `${buttonHeight.lg} ${flexGrow.shrink0} ${whitespace.nowrap} ${padding.xRelaxed}`,
              `${bgGradient.toR} ${gradientFrom.accent} ${gradientVia.accent} ${gradientTo.primary} ${weight.semibold} ${textColor.accentForeground}`,
              `${shadow.md} ${transition.all} ${animateDuration.default}`,
              `hover:scale-[1.02] hover:${gradientFrom.accent90} hover:${gradientVia.accent90} hover:${gradientTo.primary90} hover:${shadow.lg}`,
              activeScale.down,
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              `disabled:${cursor.notAllowed} disabled:${opacityLevel[50]} disabled:hover:scale-100`,
              `${width.full} sm:${width.auto} sm:${minWidth.newsletterButton}`
            )}
          >
            {isSubmitting ? (
              <InlineSpinner size="sm" message="Subscribing..." />
            ) : (
              <span className={cluster.compact}>
                {NEWSLETTER_CTA_CONFIG.buttonText}
                <Mail className={iconSize.sm} aria-hidden="true" />
              </span>
            )}
          </Button>
        </div>
        {error && (
          <p
            id={errorId}
            className={`slide-in-from-top-1 fade-in animate-in ${helper.destructive}`}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </form>
  );
}