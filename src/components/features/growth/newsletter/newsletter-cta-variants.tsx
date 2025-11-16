'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { useLoggedAsync } from '@/src/hooks/use-logged-async';
import { useNewsletterCount } from '@/src/hooks/use-newsletter-count';
import { NEWSLETTER_CTA_CONFIG } from '@/src/lib/data/config/category';
import { Mail } from '@/src/lib/icons';
import { DIMENSIONS, UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';
import type { NewsletterSource } from '@/src/types/database-overrides';
import { NewsletterForm } from './newsletter-form';
import {
  formatSubscriberCount,
  getContextualMessage,
  getCTAVariantCopy,
  loadNewsletterConfig,
} from './newsletter-utils';

export interface NewsletterCTABaseProps {
  source: NewsletterSource;
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

  // Load newsletter config from Statsig
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
          'w-full bg-gradient-to-br from-card/80 via-card/60 to-card/40',
          'backdrop-blur-sm',
          'rounded-2xl border border-border/30',
          'shadow-black/5 shadow-lg',
          'p-10 md:p-16',
          'text-center',
          className
        )}
      >
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4 shadow-accent/10 shadow-md backdrop-blur-sm">
            <Mail className={`${UI_CLASSES.ICON_XL} text-accent`} aria-hidden="true" />
          </div>
        </div>

        <h2 className="mb-4 font-bold text-3xl text-foreground leading-tight tracking-tight md:text-4xl">
          {finalHeadline}
        </h2>

        <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground leading-relaxed md:text-lg">
          {finalDescription}
        </p>

        <div className="mx-auto max-w-xl">
          <NewsletterForm source={source} className="w-full" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-muted-foreground/80 text-sm">{NEWSLETTER_CTA_CONFIG.footerText}</p>
          <p className="flex items-center gap-1.5 text-muted-foreground/60 text-xs">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                Join
                <span className="inline-block h-3 w-12 animate-pulse rounded bg-muted-foreground/20" />
                subscribers
              </span>
            ) : (
              `Join ${subscriberCount} subscribers`
            )}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Card
        className={cn(
          'border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background/95',
          'shadow-lg backdrop-blur-sm',
          className
        )}
      >
        <CardHeader className="pb-5">
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} mb-3`}>
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5">
              <Mail className={`${UI_CLASSES.ICON_MD} text-primary`} aria-hidden="true" />
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
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} min-w-0 flex-1`}>
          <Mail className={`${UI_CLASSES.ICON_MD} flex-shrink-0 text-primary`} aria-hidden="true" />
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
          'flex h-full flex-col border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background/95',
          'shadow-lg backdrop-blur-sm',
          className
        )}
      >
        <CardHeader className="flex-1">
          <div className="mb-4">
            <div className="inline-flex rounded-lg border border-primary/20 bg-primary/10 p-3">
              <Mail className={`${UI_CLASSES.ICON_LG} text-primary`} aria-hidden="true" />
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
