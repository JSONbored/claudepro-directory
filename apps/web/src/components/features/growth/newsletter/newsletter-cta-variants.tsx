'use client';

import type { newsletter_source } from '@heyclaude/data-layer/prisma';
import { logUnhandledPromise, NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Mail } from '@heyclaude/web-runtime/icons';
import {
  cn,
  DIMENSIONS,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, cluster, iconSize, size, weight, leading, tracking, truncate, iconSizeRect, muted, marginX, marginBottom, spaceY, padding, marginTop, gap, paddingBottom } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { useNewsletterCount } from '@/src/hooks/use-newsletter-count';

import { NewsletterForm } from './newsletter-form';
import {
  formatSubscriberCount,
  getContextualMessage,
  getCTAVariantCopy,
  loadNewsletterConfig,
} from './newsletter-utils';

export interface NewsletterCTABaseProps {
  category?: string;
  className?: string;
  ctaVariant?: 'aggressive' | 'social_proof' | 'value_focused';
  description?: string;
  headline?: string;
  source: newsletter_source;
}

export interface NewsletterHeroProps extends NewsletterCTABaseProps {
  variant: 'hero';
}

export interface NewsletterInlineProps extends NewsletterCTABaseProps {
  variant: 'inline';
}

export interface NewsletterMinimalProps extends NewsletterCTABaseProps {
  variant: 'minimal';
}

export interface NewsletterCardProps extends NewsletterCTABaseProps {
  variant: 'card';
}

export type NewsletterCTAVariantProps =
  | NewsletterCardProps
  | NewsletterHeroProps
  | NewsletterInlineProps
  | NewsletterMinimalProps;

/**
 * Renders a newsletter call-to-action in one of four visual variants and supplies the form and footer content.
 *
 * Loads default newsletter configuration and uses subscriber count to select contextual or variant copy; prop values for `headline` and `description` take precedence over contextual and variant defaults.
 *
 * @param props.variant - Visual variant to render: `"hero" | "inline" | "minimal" | "card"`.
 * @param props.source - Identifier for the origin of form submissions (passed to the NewsletterForm).
 * @param props.className - Optional additional CSS class names applied to the root element.
 * @param props.category - Optional category key used to select contextual messaging from the newsletter configuration.
 * @param props.headline - Optional explicit headline to render; overrides contextual and variant headlines.
 * @param props.description - Optional explicit description to render; overrides contextual and variant descriptions.
 * @param props.ctaVariant - Optional CTA copy variant key; defaults to `"value_focused"` when not provided.
 *
 * @returns The rendered React element for the selected variant, or `null` when the variant is unsupported.
 *
 * @see NewsletterForm
 * @see loadNewsletterConfig
 * @see useNewsletterCount
 * @see NEWSLETTER_CTA_CONFIG
 */
export function NewsletterCTAVariant(props: NewsletterCTAVariantProps) {
  const {
    variant,
    source,
    className,
    category,
    headline,
    description,
    ctaVariant: propCtaVariant,
  } = props;
  const { count, isLoading } = useNewsletterCount();
  const [newsletterConfig, setNewsletterConfig] = useState<Record<string, unknown>>({});
  const shouldReduceMotion = useReducedMotion();
  const loadConfig = useLoggedAsync({
    scope: 'NewsletterCTAVariant',
    defaultMessage: 'Failed to load newsletter config',
    defaultLevel: 'warn',
    defaultRethrow: false,
  });

  // Load newsletter config from static defaults
  useEffect(() => {
    loadConfig(
      async () => {
        const config = await loadNewsletterConfig();
        setNewsletterConfig(config);
      },
      {
        context: {
          variant,
          category,
        },
      }
    ).catch((error) => {
      logUnhandledPromise('NewsletterCTAVariant: loadConfig failed', error, {
        variant,
        category,
      });
    });
  }, [category, loadConfig, variant]);

  // Use prop if provided, otherwise default to 'value_focused'
  const ctaVariant = propCtaVariant || 'value_focused';
  const subscriberCount = formatSubscriberCount(count);

  // Copy priority: explicit prop > contextual (if category) > experiment variant > default
  const { headline: contextHeadline, description: contextDescription } = getContextualMessage(
    category,
    newsletterConfig
  );
  const { headline: variantHeadline, description: variantDescription } = getCTAVariantCopy(
    ctaVariant,
    subscriberCount,
    newsletterConfig
  );

  const finalHeadline = headline || (category ? contextHeadline : variantHeadline);
  const finalDescription = description || (category ? contextDescription : variantDescription);

  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'w-full',
          'border-border rounded-xl border',
          'bg-card',
          'px-6 py-10 md:px-10 md:py-12 lg:px-12 lg:py-14',
          'text-center',
          className
        )}
      >
        {/* Icon */}
        <motion.div
          className={`${marginBottom['5']} inline-flex`}
          initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={SPRING.smooth}
        >
          <div className={`border-border bg-background rounded-xl border ${padding.compact}`}>
            <Mail className="text-foreground h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className={`text-foreground mx-auto ${marginBottom.default} max-w-md ${size.xl} ${leading.tight} ${weight.semibold} ${tracking.tight} md:${size['2xl']}`}
          initial={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: STAGGER.fast }}
        >
          {finalHeadline}
        </motion.h2>

        {/* Description */}
        <motion.p
          className={cn(muted.default, marginX.auto, marginBottom.comfortable, 'max-w-lg', size.sm, leading.relaxed, 'md:' + size.base)}
          initial={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: STAGGER.medium }}
        >
          {finalDescription}
        </motion.p>

        {/* Form */}
        <motion.div
          className={`${marginX.auto} max-w-sm`}
          initial={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: STAGGER.default }}
        >
          <NewsletterForm source={source} className="w-full" />
        </motion.div>

        {/* Footer info */}
        <motion.div
          className={`${marginTop['5']} flex flex-col items-center ${gap.tight}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: STAGGER.comfortable }}
        >
          <div className={cn(cluster.compact, gap.compact)}>
            <span className={cn('inline-flex', iconSizeRect['1.5x1.5'], 'rounded-full bg-green-500')} />
            {isLoading ? (
              <span className={cn(muted.default, size.xs)}>
                <span className="bg-muted/50 inline-block h-3 w-14 animate-pulse rounded" />
              </span>
            ) : (
              <span className={cn(muted.default, size.xs)}>{subscriberCount} subscribers</span>
            )}
          </div>
          <p className={cn('text-muted-foreground/60', size.xs)}>{NEWSLETTER_CTA_CONFIG.footerText}</p>
        </motion.div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Card
        className={cn(
          'border-border bg-card',
          'shadow-lg',
          className
        )}
      >
        <CardHeader className={`${paddingBottom.default}`}>
          <div className={`${cluster.default} ${marginBottom.default}`}>
            <div className={`border-primary/20 bg-primary/10 rounded-lg border ${padding.tight}.5`}>
              <Mail className={`${iconSize.md} text-primary`} aria-hidden="true" />
            </div>
            <CardTitle className={`${size.xl} ${weight.bold}`}>{finalHeadline}</CardTitle>
          </div>
          <CardDescription className={`${size.base} ${leading.relaxed}`}>
            {finalDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className={spaceY.comfortable}>
          <NewsletterForm source={source} />
          <div className={cn(muted.default, 'text-center', size.xs)}>
            <span>{NEWSLETTER_CTA_CONFIG.footerText}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex flex-col items-stretch justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5',
          'border-border/50 bg-accent/5 rounded-lg border',
          className
        )}
      >
        <div className={`${cluster.default} min-w-0 flex-1`}>
          <Mail className={`${iconSize.md} text-primary shrink-0`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className={`${truncate.single} ${size.sm} ${weight.medium}`}>{finalHeadline}</p>
            <p className={cn(muted.default, truncate.single, size.xs)}>{finalDescription}</p>
          </div>
        </div>
        <NewsletterForm
          source={source}
          className={`w-full sm:w-auto sm:${DIMENSIONS.MIN_W_NEWSLETTER_FORM} sm:${DIMENSIONS.NEWSLETTER_FORM_MAX}`}
        />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card
        className={cn(
          'border-border bg-card flex h-full flex-col',
          'shadow-lg',
          className
        )}
      >
        <CardHeader className="flex-1">
          <div className={`${marginBottom.default}`}>
            <div className={`border-primary/20 bg-primary/10 inline-flex rounded-lg border ${padding.compact}`}>
              <Mail className={`${iconSize.lg} text-primary`} aria-hidden="true" />
            </div>
          </div>
          <CardTitle className={`${marginBottom.default} ${size.xl} ${weight.bold}`}>{finalHeadline}</CardTitle>
          <CardDescription className={`${size.sm} ${leading.relaxed}`}>{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className={spaceY.comfortable}>
          <NewsletterForm source={source} />
          <div className="text-center">
            <p className={cn(muted.default, size.xs)}>{NEWSLETTER_CTA_CONFIG.footerText}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
