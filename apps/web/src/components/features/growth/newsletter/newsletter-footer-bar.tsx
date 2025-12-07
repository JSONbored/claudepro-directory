'use client';

import { type Database } from '@heyclaude/database-types';
import { getAppSettings, getNewsletterConfig } from '@heyclaude/web-runtime/config/static-configs';
import {
  ensureNumber,
  ensureStringArray,
  logUnhandledPromise,
  NEWSLETTER_CTA_CONFIG,
} from '@heyclaude/web-runtime/core';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Mail, X } from '@heyclaude/web-runtime/icons';
import { DIMENSIONS, POSITION_PATTERNS, UI_CLASSES, Button } from '@heyclaude/web-runtime/ui';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { NewsletterForm } from './newsletter-form';

export interface NewsletterFooterBarProps {
  ctaVariant?: 'aggressive' | 'social_proof' | 'value_focused';
  dismissible?: boolean;
  respectInlineCTA?: boolean;
  showAfterDelay?: number;
  source: Database['public']['Enums']['newsletter_source'];
}

export function NewsletterFooterBar({
  source,
  dismissible = true,
  showAfterDelay,
  respectInlineCTA = true,
  ctaVariant = 'value_focused',
}: NewsletterFooterBarProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
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
  }, [dismissible, loadConfigs, pathname, respectInlineCTA, showAfterDelay]);

  const hasInlineCTA =
    respectInlineCTA && pagesWithInlineCTA.some((page) => pathname?.startsWith(page));

  useEffect(() => {
    setIsClient(true);

    const isDismissed = localStorage.getItem('newsletter-bar-dismissed');

    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);

      return () => {
        clearTimeout(timer);
      };
    }

    return;
  }, [delayMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter-bar-dismissed', 'true');
  };

  if (!(isClient && isVisible) || hasInlineCTA) {
    return null;
  }

  return (
    <aside
      className={`slide-in-from-bottom ${POSITION_PATTERNS.FIXED_BOTTOM_FULL_RESPONSIVE} animate-in border-border-medium bg-bg-overlaydrop-blur-xl z-50 border-t-2 duration-300`}
      aria-label="Newsletter signup"
    >
      <div
        className={`${POSITION_PATTERNS.ABSOLUTE_TOP_FULL} h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent`}
      />
      <div className="container mx-auto px-4 py-6 md:py-4">
        {/* Desktop layout */}
        <div className="mx-auto hidden max-w-5xl items-center justify-between gap-6 md:flex">
          <div className="flex shrink-0 items-center gap-3">
            <div className="border-accent/20 bg-accent/10 rounded-lg border p-2.5">
              <Mail className={`${UI_CLASSES.ICON_MD} text-accent`} aria-hidden="true" />
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
          <div className="flex shrink-0 items-center gap-3">
            <NewsletterForm source={source} className={DIMENSIONS.MIN_W_NEWSLETTER_FORM_LG} />
            {dismissible ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
                className="shrink-0"
              >
                <X className={UI_CLASSES.ICON_SM} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>

        {/* Mobile layout */}
        <div className={`${UI_CLASSES.FLEX_COL_GAP_3} md:hidden`}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <div className="flex items-center gap-2">
              <Mail className={`${UI_CLASSES.ICON_SM} shrink-0nt`} aria-hidden="true" />
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
                <X className={UI_CLASSES.ICON_SM} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          <NewsletterForm source={source} />
        </div>
      </div>
    </aside>
  );
}
