'use client';

import type { Database } from '@heyclaude/database-types';
import { cluster, iconSize } from '@heyclaude/web-runtime/design-system';
import { logUnhandledPromise, NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Mail } from '@heyclaude/web-runtime/icons';
import { cn, DIMENSIONS } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { useNewsletterCount } from '@/src/hooks/use-newsletter-count';

import { NewsletterForm } from './newsletter-form';
import {
  formatSubscriberCount,
  getContextualMessage,
  getCTAVariantCopy,
  loadNewsletterConfig,
} from './newsletter-utils';

export interface NewsletterCTABaseProps {
  source: Database['public']['Enums']['newsletter_source'];
  className?: string;
  category?: string;
  headline?: string;
  description?: string;
  ctaVariant?: 'aggressive' | 'social_proof' | 'value_focused';
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
  | NewsletterHeroProps
  | NewsletterInlineProps
  | NewsletterMinimalProps
  | NewsletterCardProps;

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
          'rounded-xl border border-border/50',
          'bg-card/50',
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
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="rounded-xl border border-border bg-background p-3">
            <Mail className="h-6 w-6 text-foreground md:h-7 md:w-7" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2 
          className="mx-auto mb-3 max-w-md font-semibold text-xl text-foreground leading-tight tracking-tight md:text-2xl"
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {finalHeadline}
        </motion.h2>

        {/* Description */}
        <motion.p 
          className="mx-auto mb-6 max-w-lg text-muted-foreground text-sm leading-relaxed md:text-base"
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
                <span className="inline-block h-3 w-14 animate-pulse rounded bg-muted/50" />
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
          'border-primary/20 bg-linear-to-br from-primary/5 via-accent/5 to-background/95',
          'shadow-lg backdrop-blur-sm',
          className
        )}
      >
        <CardHeader className="pb-5">
          <div className={`${cluster.default} mb-3`}>
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5">
              <Mail className={`${iconSize.md} text-primary`} aria-hidden="true" />
            </div>
            <CardTitle className="font-bold text-xl">{finalHeadline}</CardTitle>
          </div>
          <CardDescription className="text-base leading-relaxed">
            {finalDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewsletterForm source={source} />
          <div className="text-center text-muted-foreground text-xs">
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
          'rounded-lg border border-border/50 bg-accent/5',
          className
        )}
      >
        <div className={`${cluster.default} min-w-0 flex-1`}>
          <Mail className={`${iconSize.md} shrink-0 text-primary`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{finalHeadline}</p>
            <p className="truncate text-muted-foreground text-xs">{finalDescription}</p>
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
          'flex h-full flex-col border-primary/20 bg-linear-to-br from-primary/5 via-accent/5 to-background/95',
          'shadow-lg backdrop-blur-sm',
          className
        )}
      >
        <CardHeader className="flex-1">
          <div className="mb-4">
            <div className="inline-flex rounded-lg border border-primary/20 bg-primary/10 p-3">
              <Mail className={`${iconSize.lg} text-primary`} aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="mb-3 font-bold text-xl">{finalHeadline}</CardTitle>
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
