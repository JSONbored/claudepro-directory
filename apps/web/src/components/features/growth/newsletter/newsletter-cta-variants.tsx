'use client';

import type { newsletter_source } from '@prisma/client';
import { logUnhandledPromise } from '@heyclaude/web-runtime/errors';
import { NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/config/marketing-client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Mail } from '@heyclaude/web-runtime/icons';
import {
  cn,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
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
          className="mb-5 inline-flex"
          initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={SPRING.smooth}
        >
          <div className="border-border bg-background rounded-xl border p-3">
            <Mail className="text-foreground h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-foreground mx-auto mb-4 max-w-md text-xl leading-tight font-semibold tracking-tight md:text-2xl"
          initial={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: STAGGER.fast }}
        >
          {finalHeadline}
        </motion.h2>

        {/* Description */}
        <motion.p
          className={cn(
            'text-muted-foreground mx-auto mb-6 max-w-lg text-sm leading-relaxed md:text-base'
          )}
          initial={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: STAGGER.medium }}
        >
          {finalDescription}
        </motion.p>

        {/* Form */}
        <motion.div
          className="mx-auto max-w-sm"
          initial={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: STAGGER.default }}
        >
          <NewsletterForm source={source} className="w-full" />
        </motion.div>

        {/* Footer info */}
        <motion.div
          className="mt-5 flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: STAGGER.comfortable }}
        >
          <div className={cn('flex items-center gap-2')}>
            <span className={cn('inline-flex', 'h-6 w-6', 'rounded-full bg-[var(--color-success)]')} />
            {isLoading ? (
              <span className={cn('text-muted-foreground', 'text-xs')}>
                <span className="bg-muted/50 inline-block h-3 w-14 animate-pulse rounded" />
              </span>
            ) : (
              <span className={cn('text-muted-foreground', 'text-xs')}>
                {subscriberCount} subscribers
              </span>
            )}
          </div>
          <p className={cn('text-muted-foreground/60', 'text-xs')}>
            {NEWSLETTER_CTA_CONFIG.footerText}
          </p>
        </motion.div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Card className={cn('border-border bg-card', 'shadow-lg', className)}>
        <CardHeader className="pb-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="border-primary/20 bg-primary/10 card-base p-2.5">
              <Mail className="text-primary h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg font-bold">{finalHeadline}</CardTitle>
          </div>
          <CardDescription className="text-base leading-relaxed">
            {finalDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewsletterForm source={source} />
          <div className={cn('text-muted-foreground', 'text-center', 'text-xs')}>
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
          'border-border/50 bg-accent/5 card-base',
          className
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Mail className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm-medium truncate">{finalHeadline}</p>
            <p className={cn('text-muted-foreground', 'truncate', 'text-xs')}>{finalDescription}</p>
          </div>
        </div>
        <NewsletterForm
          source={source}
          className="w-full sm:w-auto sm:max-w-[400px] sm:min-w-[320px]"
        />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-border bg-card flex h-full flex-col', 'shadow-lg', className)}>
        <CardHeader className="flex-1">
          <div className="mb-4">
            <div className="border-primary/20 bg-primary/10 card-base inline-flex p-3">
              <Mail className="text-primary h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="mb-4 text-lg font-bold">{finalHeadline}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewsletterForm source={source} />
          <div className="text-center">
            <p className={cn('text-muted-foreground', 'text-xs')}>
              {NEWSLETTER_CTA_CONFIG.footerText}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
