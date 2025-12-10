'use client';

import { type Database } from '@heyclaude/database-types';
import { logUnhandledPromise, NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Mail } from '@heyclaude/web-runtime/icons';
import {
  cn,
  DIMENSIONS,
  UI_CLASSES,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { SPRING } from '@heyclaude/web-runtime/design-system';
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
  source: Database['public']['Enums']['newsletter_source'];
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
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={SPRING.smooth}
        >
          <div className="border-border bg-background rounded-xl border p-3">
            <Mail className="text-foreground h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-foreground mx-auto mb-3 max-w-md text-xl leading-tight font-semibold tracking-tight md:text-2xl"
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {finalHeadline}
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-muted-foreground mx-auto mb-6 max-w-lg text-sm leading-relaxed md:text-base"
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          {finalDescription}
        </motion.p>

        {/* Form */}
        <motion.div
          className="mx-auto max-w-sm"
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <NewsletterForm source={source} className="w-full" />
        </motion.div>

        {/* Footer info */}
        <motion.div
          className="mt-5 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            {isLoading ? (
              <span className="text-muted-foreground text-xs">
                <span className="bg-muted/50 inline-block h-3 w-14 animate-pulse rounded" />
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">{subscriberCount} subscribers</span>
            )}
          </div>
          <p className="text-muted-foreground/60 text-xs">{NEWSLETTER_CTA_CONFIG.footerText}</p>
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
        <CardHeader className="pb-5">
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} mb-3`}>
            <div className="border-primary/20 bg-primary/10 rounded-lg border p-2.5">
              <Mail className={`${UI_CLASSES.ICON_MD} text-primary`} aria-hidden="true" />
            </div>
            <CardTitle className="text-xl font-bold">{finalHeadline}</CardTitle>
          </div>
          <CardDescription className="text-base leading-relaxed">
            {finalDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewsletterForm source={source} />
          <div className="text-muted-foreground text-center text-xs">
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
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} min-w-0 flex-1`}>
          <Mail className={`${UI_CLASSES.ICON_MD} text-primary shrink-0`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{finalHeadline}</p>
            <p className="text-muted-foreground truncate text-xs">{finalDescription}</p>
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
          <div className="mb-4">
            <div className="border-primary/20 bg-primary/10 inline-flex rounded-lg border p-3">
              <Mail className={`${UI_CLASSES.ICON_LG} text-primary`} aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="mb-3 text-xl font-bold">{finalHeadline}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewsletterForm source={source} />
          <div className="text-center">
            <p className="text-muted-foreground text-xs">{NEWSLETTER_CTA_CONFIG.footerText}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
