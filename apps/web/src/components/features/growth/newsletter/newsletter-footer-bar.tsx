'use client';

import type { newsletter_source } from '@heyclaude/data-layer/prisma';
import { getAppSettings, getNewsletterConfig } from '@heyclaude/web-runtime/config/static-configs';
import {
  ensureStringArray,
  logUnhandledPromise,
  NEWSLETTER_CTA_CONFIG,
} from '@heyclaude/web-runtime/core';
import { ensureNumber } from '@heyclaude/web-runtime/data/utils';
import { useLoggedAsync, useTimeout, useLocalStorage } from '@heyclaude/web-runtime/hooks';
import { Mail, X } from '@heyclaude/web-runtime/icons';
import { Button, cn } from '@heyclaude/web-runtime/ui';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks';

import { NewsletterForm } from './newsletter-form';

export interface NewsletterFooterBarProps {
  ctaVariant?: 'aggressive' | 'social_proof' | 'value_focused';
  dismissible?: boolean;
  respectInlineCTA?: boolean;
  showAfterDelay?: number;
  source: newsletter_source;
}

export function NewsletterFooterBar({
  source,
  dismissible = true,
  showAfterDelay,
  respectInlineCTA = true,
  ctaVariant = 'value_focused',
}: NewsletterFooterBarProps) {
  const pathname = usePathname();
  const { value: isVisible, setTrue: setIsVisibleTrue, setFalse: setIsVisibleFalse } = useBoolean();
  const { value: isClient, setTrue: setIsClientTrue } = useBoolean();
  const [pagesWithInlineCTA, setPagesWithInlineCTA] = useState<string[]>([]);
  const [delayMs, setDelayMs] = useState(showAfterDelay ?? 30_000);
  const loadConfigs = useLoggedAsync({
    scope: 'NewsletterFooterBar',
    defaultMessage: 'Failed to load newsletter footer configs',
    defaultLevel: 'warn',
    defaultRethrow: false,
  });

  useEffect(() => {
    loadConfigs(
      async () => {
        // Get configs from static defaults
        const appConfig = getAppSettings();
        const newsletterConfig = getNewsletterConfig();

        const excludedPages = ensureStringArray(appConfig['newsletter.excluded_pages']);
        if (excludedPages.length > 0) {
          setPagesWithInlineCTA(excludedPages);
        }

        if (showAfterDelay === undefined) {
          const configDelay = ensureNumber(
            newsletterConfig['newsletter.footer_bar.show_after_delay_ms'],
            30_000
          );
          setDelayMs(configDelay);
        }
      },
      {
        context: {
          pathname,
          respectInlineCTA,
          dismissible,
        },
      }
    ).catch((error) => {
      logUnhandledPromise('NewsletterFooterBar: loadConfigs failed', error, {
        pathname,
        respectInlineCTA,
        dismissible,
      });
    });
  }, [dismissible, loadConfigs, pathname, respectInlineCTA, showAfterDelay, setIsClientTrue]);

  const hasInlineCTA =
    respectInlineCTA && pagesWithInlineCTA.some((page) => pathname?.startsWith(page));

  useEffect(() => {
    setIsClientTrue();
  }, [setIsClientTrue]);

  // Use useLocalStorage hook for dismiss state
  const { value: isDismissed, setValue: setIsDismissed } = useLocalStorage<string | null>('newsletter-bar-dismissed', {
    defaultValue: null,
    syncAcrossTabs: false,
  });
  
  useTimeout(() => {
    if (!isDismissed || isDismissed !== 'true') {
      setIsVisibleTrue();
    }
  }, isDismissed === 'true' ? null : delayMs);

  const handleDismiss = () => {
    setIsVisibleFalse();
    setIsDismissed('true');
  };

  if (!(isClient && isVisible) || hasInlineCTA) {
    return null;
  }

  return (
    <aside
      className="slide-in-from-bottom fixed right-0 bottom-0 left-0 animate-in border-border-medium bg-bg-overlaydrop-blur-xl z-50 border-t-2 duration-300"
      aria-label="Newsletter signup"
    >
      <div
        className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
      />
      <div className="container mx-auto px-4 py-6 md:py-4">
        {/* Desktop layout */}
        <div className="mx-auto hidden max-w-5xl items-center justify-between gap-4 md:flex">
          <div className="flex shrink-0 items-center gap-2">
            <div className={cn('border-accent/20 bg-accent/10 card-base', 'p-2.5')}>
              <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <div>
              <p className="text-foreground text-base font-semibold">
                {ctaVariant === 'aggressive'
                  ? "⚡ Don't miss out!"
                  : ctaVariant === 'social_proof'
                    ? '✨ Join 12,000+ Claude builders'
                    : NEWSLETTER_CTA_CONFIG.headline}
              </p>
              <p className="text-muted-foreground text-sm">
                {ctaVariant === 'aggressive'
                  ? 'Get weekly AI updates before everyone else'
                  : ctaVariant === 'social_proof'
                    ? 'The best Claude resources, curated weekly'
                    : NEWSLETTER_CTA_CONFIG.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NewsletterForm source={source} className="min-w-[360px]" />
            {dismissible ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
                className="shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="text-foreground text-sm font-medium">
                {ctaVariant === 'aggressive'
                  ? "⚡ Don't miss out!"
                  : ctaVariant === 'social_proof'
                    ? '✨ Join 12k+ builders'
                    : NEWSLETTER_CTA_CONFIG.headline}
              </p>
            </div>
            {dismissible ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          <NewsletterForm source={source} />
        </div>
      </div>
    </aside>
  );
}
