'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import type { NewsletterSource } from '@/src/hooks/use-newsletter';
import { NEWSLETTER_CTA_CONFIG } from '@/src/lib/config/category-config';
import { appSettings, newsletterConfigs } from '@/src/lib/flags';
import { Mail, X } from '@/src/lib/icons';
import { DIMENSIONS, POSITION_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
import { NewsletterForm } from './newsletter-form';

export interface NewsletterFooterBarProps {
  source: NewsletterSource;
  dismissible?: boolean;
  showAfterDelay?: number;
  respectInlineCTA?: boolean;
}

export function NewsletterFooterBar({
  source,
  dismissible = true,
  showAfterDelay,
  respectInlineCTA = true,
}: NewsletterFooterBarProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pagesWithInlineCTA, setPagesWithInlineCTA] = useState<string[]>([]);
  const [delayMs, setDelayMs] = useState(showAfterDelay ?? 30000);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const [appConfig, newsletterConfig] = await Promise.all([
          appSettings(),
          newsletterConfigs(),
        ]);

        const excludedPages = appConfig['newsletter.excluded_pages'] as string[];
        if (Array.isArray(excludedPages) && excludedPages.length > 0) {
          setPagesWithInlineCTA(excludedPages);
        }

        // Load delay from config if not provided via props
        if (showAfterDelay === undefined) {
          const configDelay = newsletterConfig['newsletter.footer_bar.show_after_delay_ms'] as
            | number
            | undefined;
          setDelayMs(configDelay ?? 30000);
        }
      } catch {
        // Silent fail - use defaults
      }
    };

    loadConfigs().catch(() => {
      // Intentionally ignore errors
    });
  }, [showAfterDelay]);

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

    return undefined;
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
      className={`slide-in-from-bottom ${POSITION_PATTERNS.FIXED_BOTTOM_FULL_RESPONSIVE} z-50 animate-in border-[var(--color-border-medium)] border-t-2 bg-[var(--color-bg-overlay)] shadow-xl backdrop-blur-xl duration-300`}
      aria-label="Newsletter signup"
    >
      <div
        className={`${POSITION_PATTERNS.ABSOLUTE_TOP_FULL} h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent`}
      />
      <div className="container mx-auto px-4 py-6 md:py-4">
        {/* Desktop layout */}
        <div className="mx-auto hidden max-w-5xl items-center justify-between gap-6 md:flex">
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="rounded-lg border border-accent/20 bg-accent/10 p-2.5">
              <Mail className={`${UI_CLASSES.ICON_MD} text-accent`} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-base text-foreground">
                {NEWSLETTER_CTA_CONFIG.headline}
              </p>
              <p className="text-muted-foreground text-sm">{NEWSLETTER_CTA_CONFIG.description}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <NewsletterForm source={source} className={DIMENSIONS.MIN_W_NEWSLETTER_FORM_LG} />
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
                className="flex-shrink-0"
              >
                <X className={UI_CLASSES.ICON_SM} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className={`${UI_CLASSES.FLEX_COL_GAP_3} md:hidden`}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <div className="flex items-center gap-2">
              <Mail
                className={`${UI_CLASSES.ICON_SM} flex-shrink-0 text-accent`}
                aria-hidden="true"
              />
              <p className="font-medium text-foreground text-sm">
                {NEWSLETTER_CTA_CONFIG.headline}
              </p>
            </div>
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
              >
                <X className={UI_CLASSES.ICON_SM} aria-hidden="true" />
              </Button>
            )}
          </div>
          <NewsletterForm source={source} />
        </div>
      </div>
    </aside>
  );
}
